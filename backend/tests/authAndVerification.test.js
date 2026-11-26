const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const request = require('supertest');

const tempUploadRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'herskill-uploads-'));

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_automated_suite_12345';
process.env.PRIVATE_DOCUMENT_STORAGE_PATH = tempUploadRoot;
process.env.ADMIN_EMAIL = 'admin@herskill.test';
process.env.ADMIN_PASSWORD = 'AdminStrongPassword!1';
process.env.ADMIN_NAME = 'HerSkill Test Admin';
process.env.LOGIN_RATE_LIMIT_MAX = '100';

const User = require('../src/models/User');
const SellerProfile = require('../src/models/SellerProfile');
const SellerVerification = require('../src/models/SellerVerification');

// Minimal in-memory Mongoose query/doc helper used exclusively by this test suite
function createInMemoryStore() {
  const users = [];
  const profiles = [];
  const verifications = [];

  const clone = (v) => structuredClone(v);
  const newId = () => new mongoose.Types.ObjectId().toString();

  function matchesFilter(doc, filter = {}) {
    for (const [key, val] of Object.entries(filter)) {
      if (key === '$or') {
        if (!val.some((sub) => matchesFilter(doc, sub))) return false;
        continue;
      }
      if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        if ('$gt' in val) {
          if (!(new Date(doc[key]) > new Date(val.$gt))) return false;
          continue;
        }
        if ('$ne' in val) {
          if (Array.isArray(doc[key])) {
            if (doc[key].includes(val.$ne)) return false;
          } else if (doc[key] === val.$ne) {
            return false;
          }
          continue;
        }
      }
      if (Array.isArray(doc[key]) && !Array.isArray(val)) {
        if (!doc[key].includes(val)) return false;
      } else if (String(doc[key]) !== String(val)) {
        return false;
      }
    }
    return true;
  }

  function wrapDoc(collection, raw) {
    if (!raw) return null;
    const doc = clone(raw);
    doc.save = async () => {
      doc.updatedAt = new Date();
      const idx = collection.findIndex((item) => String(item._id) === String(doc._id));
      const { save, ...plain } = doc;
      if (idx >= 0) collection[idx] = clone(plain);
      else collection.push(clone(plain));
      return doc;
    };
    return doc;
  }

  function makeQuery(collection, filter, single = true) {
    let sortSpec = null;
    let limitNum = null;
    const populates = [];

    const execute = async () => {
      let rows = collection.filter((d) => matchesFilter(d, filter));
      if (sortSpec) {
        const [field, dir] = Object.entries(sortSpec)[0];
        rows.sort((a, b) => (new Date(a[field]) - new Date(b[field])) * dir);
      }
      if (limitNum) rows = rows.slice(0, limitNum);

      const hydrate = (row) => {
        const wrapped = wrapDoc(collection, row);
        for (const p of populates) {
          if (p === 'userId' && wrapped.userId) {
            const u = users.find((x) => String(x._id) === String(wrapped.userId));
            if (u) wrapped.userId = clone(u);
          }
          if (p === 'reviewedBy' && wrapped.reviewedBy) {
            const u = users.find((x) => String(x._id) === String(wrapped.reviewedBy));
            if (u) wrapped.reviewedBy = clone(u);
          }
          if (p === 'applicationHistory.reviewedBy' && Array.isArray(wrapped.applicationHistory)) {
            wrapped.applicationHistory = wrapped.applicationHistory.map((h) => {
              if (!h.reviewedBy) return h;
              const u = users.find((x) => String(x._id) === String(h.reviewedBy));
              return { ...h, reviewedBy: u ? clone(u) : h.reviewedBy };
            });
          }
        }
        return wrapped;
      };

      if (single) {
        return rows[0] ? hydrate(rows[0]) : null;
      }
      return rows.map(hydrate);
    };

    const query = {
      select() { return query; },
      sort(s) { sortSpec = s; return query; },
      limit(n) { limitNum = n; return query; },
      populate(pathName) { populates.push(pathName); return query; },
      lean() { return execute(); },
      then(resolve, reject) { return execute().then(resolve, reject); },
    };
    return query;
  }

  // Patch User
  User.create = async (data) => {
    const now = new Date();
    const doc = {
      _id: newId(),
      roles: ['buyer'],
      activeMode: 'buyer',
      accountStatus: 'PENDING_VERIFICATION',
      isContactVerified: false,
      createdAt: now,
      updatedAt: now,
      ...clone(data),
    };
    users.push(doc);
    return wrapDoc(users, doc);
  };
  User.findOne = (filter) => makeQuery(users, filter, true);
  User.findById = (id) => makeQuery(users, { _id: id }, true);
  User.countDocuments = async (filter) =>
    users.filter((u) => matchesFilter(u, filter)).length;
  User.findByIdAndUpdate = async (id, update) => {
    const idx = users.findIndex((u) => String(u._id) === String(id));
    if (idx < 0) return null;
    if (update.$addToSet?.roles) {
      const role = update.$addToSet.roles;
      if (!users[idx].roles.includes(role)) users[idx].roles.push(role);
    }
    return wrapDoc(users, users[idx]);
  };

  // Patch SellerProfile
  SellerProfile.create = async (data) => {
    const now = new Date();
    const doc = {
      _id: newId(),
      verificationStatus: 'NOT_SUBMITTED',
      categories: [],
      portfolio: { images: [], socialLink: '' },
      createdAt: now,
      updatedAt: now,
      ...clone(data),
    };
    profiles.push(doc);
    return wrapDoc(profiles, doc);
  };
  SellerProfile.findOne = (filter) => makeQuery(profiles, filter, true);
  SellerProfile.findOneAndUpdate = async (filter, update, opts = {}) => {
    const idx = profiles.findIndex((p) => matchesFilter(p, filter));
    const now = new Date();
    const { $unset, ...fields } = update;
    if (idx >= 0) {
      profiles[idx] = { ...profiles[idx], ...clone(fields), updatedAt: now };
      if ($unset) {
        for (const k of Object.keys($unset)) delete profiles[idx][k];
      }
      return wrapDoc(profiles, profiles[idx]);
    }
    if (opts.upsert) {
      return SellerProfile.create({ ...filter, ...fields });
    }
    return null;
  };

  // Patch SellerVerification
  SellerVerification.create = async (data) => {
    const now = new Date();
    const doc = {
      _id: newId(),
      applicationHistory: [],
      createdAt: now,
      updatedAt: now,
      ...clone(data),
    };
    verifications.push(doc);
    return wrapDoc(verifications, doc);
  };
  SellerVerification.findOne = (filter) => makeQuery(verifications, filter, true);
  SellerVerification.findById = (id) => makeQuery(verifications, { _id: id }, true);
  SellerVerification.find = (filter) => makeQuery(verifications, filter, false);
  SellerVerification.countDocuments = async (filter) =>
    verifications.filter((v) => matchesFilter(v, filter)).length;

  return { users, profiles, verifications };
}

const PNG_BUFFER = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex'
);
const PDF_BUFFER = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

describe('HerSkill Auth, User Management & Seller Verification API', () => {
  let app;
  let store;
  let buyerToken;
  let sellerToken;
  let adminToken;
  let verificationId;
  const origReadyStateDescriptor = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(mongoose.connection),
    'readyState'
  );

  before(async () => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      configurable: true,
      get: () => 1,
    });
    store = createInMemoryStore();
    app = require('../src/app');
    const { seedInitialAdmin } = require('../src/utils/seedAdmin');
    const seedResult = await seedInitialAdmin();
    assert.equal(seedResult.seeded, true);
  });

  after(() => {
    if (origReadyStateDescriptor) {
      Object.defineProperty(mongoose.connection, 'readyState', origReadyStateDescriptor);
    }
    fs.rmSync(tempUploadRoot, { recursive: true, force: true });
  });

  it('serves the root API welcome message and health status', async () => {
    const rootRes = await request(app).get('/');
    assert.equal(rootRes.status, 200);
    assert.equal(rootRes.text, 'Welcome to HerSkill API!');

    const healthRes = await request(app).get('/api/health');
    assert.equal(healthRes.status, 200);
    assert.equal(healthRes.body.databaseConnected, true);
  });

  it('registers a buyer, prevents duplicate registration, verifies contact, and logs in', async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Sana Fatima',
      email: 'sana@example.com',
      phone: '+923001112233',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      accountType: 'buyer',
    });

    assert.equal(regRes.status, 201);
    assert.equal(regRes.body.success, true);
    assert.deepEqual(regRes.body.user.roles, ['buyer']);
    assert.equal(regRes.body.user.passwordHash, undefined);
    buyerToken = regRes.body.token;
    const code = regRes.body.verificationDelivery.devVerificationCode;
    assert.ok(code);

    const dupRes = await request(app).post('/api/auth/register').send({
      name: 'Sana Duplicate',
      email: 'sana@example.com',
      phone: '+923009998877',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      accountType: 'buyer',
    });
    assert.equal(dupRes.status, 409);

    const verifyRes = await request(app)
      .post('/api/auth/verify-contact')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ code, method: 'email' });
    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.body.user.isContactVerified, true);

    const buyerLogin = await request(app).post('/api/auth/login').send({
      identifier: 'sana@example.com',
      password: 'Password123!',
      requestedMode: 'buyer',
      rememberMe: true,
    });
    assert.equal(buyerLogin.status, 200);
    assert.equal(buyerLogin.body.modeGuidance.grantedMode, 'buyer');
    assert.equal(buyerLogin.body.modeGuidance.redirectTo, '/buyer/dashboard');

    const buyerWantingSeller = await request(app).post('/api/auth/login').send({
      identifier: '+923001112233',
      password: 'Password123!',
      requestedMode: 'seller',
    });
    assert.equal(buyerWantingSeller.status, 200);
    assert.equal(buyerWantingSeller.body.modeGuidance.needsSellerActivation, true);
    assert.equal(buyerWantingSeller.body.modeGuidance.grantedMode, 'buyer');
    assert.equal(buyerWantingSeller.body.modeGuidance.canAccessSellerDashboard, false);
  });

  it('allows an existing buyer to activate seller mode on the same account without duplicating users', async () => {
    const beforeCount = store.users.filter((u) => u.email === 'sana@example.com').length;
    assert.equal(beforeCount, 1);

    const activateRes = await request(app)
      .post('/api/seller/activate')
      .set('Authorization', `Bearer ${buyerToken}`);

    assert.equal(activateRes.status, 200);
    assert.ok(activateRes.body.user.roles.includes('buyer'));
    assert.ok(activateRes.body.user.roles.includes('seller'));
    assert.equal(activateRes.body.seller.verificationStatus, 'NOT_SUBMITTED');

    const afterCount = store.users.filter((u) => u.email === 'sana@example.com').length;
    assert.equal(afterCount, 1);
  });

  it('registers a seller, blocks unverified publishing on backend, and rejects invalid file uploads', async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Zoya Khan',
      email: 'zoya@example.com',
      phone: '+923004445566',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      accountType: 'seller',
    });
    assert.equal(regRes.status, 201);
    assert.ok(regRes.body.user.roles.includes('seller'));
    assert.equal(regRes.body.seller.verificationStatus, 'NOT_SUBMITTED');
    sellerToken = regRes.body.token;

    const publishBlocked = await request(app)
      .post('/api/seller/publish-check')
      .set('Authorization', `Bearer ${sellerToken}`);
    assert.equal(publishBlocked.status, 403);
    assert.equal(publishBlocked.body.code, 'SELLER_NOT_VERIFIED');

    const badFileRes = await request(app)
      .post('/api/seller/verification')
      .set('Authorization', `Bearer ${sellerToken}`)
      .field('legalName', 'Zoya Khan')
      .field('dateOfBirth', '1996-05-15')
      .field('phone', '+923004445566')
      .field('email', 'zoya@example.com')
      .field('city', 'Lahore')
      .field('residentialAddress', '12 Gulberg III, Lahore')
      .field('cnicNumber', '35202-1234567-1')
      .field('businessName', 'Zoya Crafts')
      .field('categories', JSON.stringify(['Handmade Crafts & Art']))
      .field('businessDescription', 'Handcrafted embroidered home decor and gifts.')
      .field('declarationAccepted', 'true')
      .attach('cnicFront', Buffer.from('not an image'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      })
      .attach('cnicBack', PNG_BUFFER, {
        filename: 'back.png',
        contentType: 'image/png',
      });

    assert.equal(badFileRes.status, 400);
  });

  it('submits seller verification, prevents duplicate pending submissions, and keeps identity data private', async () => {
    const submitRes = await request(app)
      .post('/api/seller/verification')
      .set('Authorization', `Bearer ${sellerToken}`)
      .field('legalName', 'Zoya Khan')
      .field('dateOfBirth', '1996-05-15')
      .field('phone', '+923004445566')
      .field('email', 'zoya@example.com')
      .field('city', 'Lahore')
      .field('residentialAddress', '12 Gulberg III, Lahore')
      .field('cnicNumber', '35202-1234567-1')
      .field('businessName', 'Zoya Crafts')
      .field('categories', JSON.stringify(['Handmade Crafts & Art']))
      .field('businessDescription', 'Handcrafted embroidered home decor and gifts.')
      .field('declarationAccepted', 'true')
      .attach('cnicFront', PNG_BUFFER, {
        filename: 'cnic-front.png',
        contentType: 'image/png',
      })
      .attach('cnicBack', PDF_BUFFER, {
        filename: 'cnic-back.pdf',
        contentType: 'application/pdf',
      })
      .attach('portfolioImages', PNG_BUFFER, {
        filename: 'sample-1.png',
        contentType: 'image/png',
      });

    assert.equal(submitRes.status, 201);
    assert.equal(submitRes.body.verification.status, 'PENDING');
    assert.equal(
      submitRes.body.verification.submittedInformation.identity.cnicMasked,
      '*****-*******-1'
    );
    assert.equal(
      submitRes.body.verification.submittedInformation.identity.cnicEncrypted,
      undefined
    );

    const dupSubmitRes = await request(app)
      .post('/api/seller/verification')
      .set('Authorization', `Bearer ${sellerToken}`)
      .field('legalName', 'Zoya Khan')
      .field('dateOfBirth', '1996-05-15')
      .field('phone', '+923004445566')
      .field('email', 'zoya@example.com')
      .field('city', 'Lahore')
      .field('residentialAddress', '12 Gulberg III, Lahore')
      .field('cnicNumber', '35202-1234567-1')
      .field('businessName', 'Zoya Crafts')
      .field('categories', JSON.stringify(['Handmade Crafts & Art']))
      .field('businessDescription', 'Handcrafted embroidered home decor and gifts.')
      .field('declarationAccepted', 'true')
      .attach('cnicFront', PNG_BUFFER, {
        filename: 'cnic-front.png',
        contentType: 'image/png',
      })
      .attach('cnicBack', PNG_BUFFER, {
        filename: 'cnic-back.png',
        contentType: 'image/png',
      });
    assert.equal(dupSubmitRes.status, 409);

    const pendingLogin = await request(app).post('/api/auth/login').send({
      identifier: 'zoya@example.com',
      password: 'Password123!',
      requestedMode: 'seller',
    });
    assert.equal(pendingLogin.status, 200);
    assert.equal(
      pendingLogin.body.modeGuidance.redirectTo,
      '/seller/verification/pending'
    );
    assert.equal(pendingLogin.body.modeGuidance.canAccessSellerDashboard, false);

    const publishStillBlocked = await request(app)
      .post('/api/seller/publish-check')
      .set('Authorization', `Bearer ${sellerToken}`);
    assert.equal(publishStillBlocked.status, 403);
  });

  it('enforces protected routes and blocks non-admins from admin APIs and private documents', async () => {
    const unauthMe = await request(app).get('/api/auth/me');
    assert.equal(unauthMe.status, 401);

    const sellerToAdmin = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${sellerToken}`);
    assert.equal(sellerToAdmin.status, 403);

    const adminPublicLogin = await request(app).post('/api/auth/login').send({
      identifier: 'admin@herskill.test',
      password: 'AdminStrongPassword!1',
    });
    assert.equal(adminPublicLogin.status, 403);

    const sellerAdminLogin = await request(app).post('/api/auth/admin/login').send({
      email: 'zoya@example.com',
      password: 'Password123!',
    });
    assert.equal(sellerAdminLogin.status, 401);
  });

  it('allows admin login, dashboard metrics, secure document access, rejection, resubmission with history, and approval', async () => {
    const adminLoginRes = await request(app).post('/api/auth/admin/login').send({
      email: 'admin@herskill.test',
      password: 'AdminStrongPassword!1',
    });
    assert.equal(adminLoginRes.status, 200);
    adminToken = adminLoginRes.body.token;

    const dashRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(dashRes.status, 200);
    assert.equal(dashRes.body.stats.totalUsers, 2);
    assert.equal(dashRes.body.stats.pendingVerifications, 1);

    const listRes = await request(app)
      .get('/api/admin/verifications?status=PENDING')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.verifications.length, 1);
    verificationId = listRes.body.verifications[0].id;

    const sellerDocAttempt = await request(app)
      .get(`/api/admin/verifications/${verificationId}/documents/cnicFront`)
      .set('Authorization', `Bearer ${sellerToken}`);
    assert.equal(sellerDocAttempt.status, 403);

    const detailRes = await request(app)
      .get(`/api/admin/verifications/${verificationId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(detailRes.status, 200);
    assert.equal(detailRes.body.verification.identity.cnicNumber, '35202-1234567-1');

    const docRes = await request(app)
      .get(`/api/admin/verifications/${verificationId}/documents/cnicFront`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(docRes.status, 200);
    assert.equal(docRes.headers['content-type'], 'image/png');

    const rejectRes = await request(app)
      .patch(`/api/admin/verifications/${verificationId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rejectionReason: 'CNIC back image needs higher resolution.' });
    assert.equal(rejectRes.status, 200);
    assert.equal(rejectRes.body.status, 'REJECTED');

    const publishRejected = await request(app)
      .post('/api/seller/publish-check')
      .set('Authorization', `Bearer ${sellerToken}`);
    assert.equal(publishRejected.status, 403);

    const statusRes = await request(app)
      .get('/api/seller/verification-status')
      .set('Authorization', `Bearer ${sellerToken}`);
    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.body.verification.status, 'REJECTED');
    assert.equal(
      statusRes.body.verification.rejectionReason,
      'CNIC back image needs higher resolution.'
    );

    const resubmitRes = await request(app)
      .put('/api/seller/verification/resubmit')
      .set('Authorization', `Bearer ${sellerToken}`)
      .field('legalName', 'Zoya Khan')
      .field('dateOfBirth', '1996-05-15')
      .field('phone', '+923004445566')
      .field('email', 'zoya@example.com')
      .field('city', 'Lahore')
      .field('residentialAddress', '12 Gulberg III, Lahore')
      .field('businessName', 'Zoya Crafts Studio')
      .field('categories', JSON.stringify(['Handmade Crafts & Art']))
      .field('businessDescription', 'Handcrafted embroidered home decor and custom gifts.')
      .field('declarationAccepted', 'true')
      .attach('cnicBack', PNG_BUFFER, {
        filename: 'cnic-back-clear.png',
        contentType: 'image/png',
      });

    assert.equal(resubmitRes.status, 200);
    assert.equal(resubmitRes.body.verification.status, 'PENDING');
    assert.equal(resubmitRes.body.verification.applicationHistory.length, 2);
    assert.equal(resubmitRes.body.verification.applicationHistory[0].status, 'REJECTED');
    assert.equal(resubmitRes.body.verification.applicationHistory[1].status, 'PENDING');

    const approveRes = await request(app)
      .patch(`/api/admin/verifications/${verificationId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(approveRes.status, 200);
    assert.equal(approveRes.body.status, 'APPROVED');

    const publishApproved = await request(app)
      .post('/api/seller/publish-check')
      .set('Authorization', `Bearer ${sellerToken}`);
    assert.equal(publishApproved.status, 200);
    assert.equal(publishApproved.body.canPublish, true);

    const approvedLogin = await request(app).post('/api/auth/login').send({
      identifier: 'zoya@example.com',
      password: 'Password123!',
      requestedMode: 'seller',
    });
    assert.equal(approvedLogin.status, 200);
    assert.equal(approvedLogin.body.modeGuidance.canAccessSellerDashboard, true);
    assert.equal(approvedLogin.body.modeGuidance.redirectTo, '/seller/dashboard');
  });

  it('supports forgot password and reset password flow', async () => {
    const forgotRes = await request(app).post('/api/auth/forgot-password').send({
      email: 'zoya@example.com',
    });
    assert.equal(forgotRes.status, 200);
    const resetToken = forgotRes.body.devResetToken;
    assert.ok(resetToken);

    const resetRes = await request(app).post('/api/auth/reset-password').send({
      token: resetToken,
      password: 'NewPassword456!',
      confirmPassword: 'NewPassword456!',
    });
    assert.equal(resetRes.status, 200);

    const loginNewRes = await request(app).post('/api/auth/login').send({
      identifier: 'zoya@example.com',
      password: 'NewPassword456!',
      requestedMode: 'seller',
    });
    assert.equal(loginNewRes.status, 200);
  });

  it('allows profile & password updates and seller profile edits without altering verification status', async () => {
    const profileRes = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        name: 'Sana Fatima Updated',
        phone: '+923001112244',
      });
    assert.equal(profileRes.status, 200);
    assert.equal(profileRes.body.user.name, 'Sana Fatima Updated');
    assert.equal(profileRes.body.user.phone, '+923001112244');

    const pwRes = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        currentPassword: 'Password123!',
        newPassword: 'BuyerNewPassword1!',
        confirmNewPassword: 'BuyerNewPassword1!',
      });
    assert.equal(pwRes.status, 200);

    // Sana activated seller mode earlier (NOT_SUBMITTED); she can edit her seller profile
    // while still being blocked from publishing until approved.
    const sellerEditRes = await request(app)
      .patch('/api/seller/profile')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        businessName: 'Sana Crochet Corner',
        businessDescription: 'Handmade crochet shawls, bags, and custom gifts made to order.',
        categories: ['Handmade Crafts & Art'],
        city: 'Karachi',
        verificationStatus: 'APPROVED',
      });
    assert.equal(sellerEditRes.status, 200);
    assert.equal(sellerEditRes.body.seller.profile.businessName, 'Sana Crochet Corner');
    assert.equal(sellerEditRes.body.seller.verificationStatus, 'NOT_SUBMITTED');

    const stillBlocked = await request(app)
      .post('/api/seller/publish-check')
      .set('Authorization', `Bearer ${buyerToken}`);
    assert.equal(stillBlocked.status, 403);
    assert.equal(stillBlocked.body.code, 'SELLER_NOT_VERIFIED');
  });
});
