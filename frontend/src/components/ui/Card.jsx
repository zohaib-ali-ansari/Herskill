export default function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-[20px] border border-[#eadfdb] bg-white p-6 shadow-[0_10px_30px_rgba(80,50,85,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}
