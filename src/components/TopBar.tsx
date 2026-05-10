import { Globe, LogIn, UserPlus } from "lucide-react";

export function TopBar() {
  return (
    <div className="top-bar">
      <div className="container top-bar__inner">
        <div className="top-bar__side">
          <a href="#lang" aria-label="切换语言">
            <Globe size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
            简体中文
          </a>
        </div>
        <div className="top-bar__side">
          <a href="#register">
            <UserPlus size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
            注册
          </a>
          <a href="#login">
            <LogIn size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
            登录
          </a>
        </div>
      </div>
    </div>
  );
}
