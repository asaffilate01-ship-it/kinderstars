import { NavLink } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BottomNavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
  badge?: number;
}

interface BottomNavProps {
  items: BottomNavItem[];
}

const BottomNav = ({ items }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden border-t border-border bg-card/98 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 flex-1 text-[10px] font-medium transition-colors relative min-w-0",
                isActive
                  ? "text-secondary"
                  : "text-muted-foreground active:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-secondary" />
                )}
                <span className="relative">
                  <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  {item.badge != null && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-1">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </span>
                <span className="truncate max-w-[56px]">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
