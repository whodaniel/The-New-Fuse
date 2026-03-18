export interface SidebarProps {
  items?: string[];
}

export function Sidebar({ items = [] }: SidebarProps) {
  return (
    <aside className="sidebar">
      {items.map((item) => (
        <div key={item}>{item}</div>
      ))}
    </aside>
  );
}
