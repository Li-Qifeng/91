export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__links">
          <a href="#about">关于我们</a>
          <a href="#terms">服务条款</a>
          <a href="#privacy">隐私政策</a>
          <a href="#dmca">版权声明</a>
          <a href="#contact">联系我们</a>
        </div>
        <div className="footer__copy">
          © {new Date().getFullYear()} 视频站 Demo · 布局演示用途
        </div>
      </div>
    </footer>
  );
}
