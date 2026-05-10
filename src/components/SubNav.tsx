import { Link } from "react-router-dom";
import { subNavLinks } from "@/data/tags";

export function SubNav() {
  return (
    <div className="sub-nav">
      <div className="container">
        <ul className="sub-nav__list">
          {subNavLinks.map((link) => (
            <li key={link.href}>
              <Link to={link.href} className="sub-nav__item">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
