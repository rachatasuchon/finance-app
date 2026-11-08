// ป๊อปอัปแบบ bottom sheet
export default function Sheet({ title, onClose, children, tall, z = 20, head }) {
  return (
    <div className="back" style={{ zIndex: z }} onClick={onClose}>
      <div className={'sheet' + (tall ? ' tall' : '')} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="sheetHead">{head || <b>{title}</b>}<button className="ghost" aria-label="close" onClick={onClose}>✕</button></div>
        {children}
      </div>
    </div>
  );
}
