export interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return <header className="header">{title}</header>;
}
