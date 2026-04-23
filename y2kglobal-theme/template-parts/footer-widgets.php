<?php defined( 'ABSPATH' ) || exit; ?>

<div class="y2k-footer-grid">
    <div class="y2k-footer-brand-col">
        <p class="y2k-footer-brand">Y2K Global</p>
        <p class="y2k-footer-tagline">
            <?php esc_html_e( 'Your go-to destination for Y2K fashion. Curated drops from the most iconic era in style history — delivered worldwide.', 'y2kglobal' ); ?>
        </p>
        <div class="y2k-footer-social">
            <a href="https://instagram.com/y2kglobal" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
            </a>
            <a href="https://tiktok.com/@y2kglobal" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>
            </a>
            <a href="https://pinterest.com/y2kglobal" target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.43 7.64 11.17-.1-.96-.2-2.44.04-3.49.22-.95 1.46-6.2 1.46-6.2s-.37-.74-.37-1.84c0-1.73 1-3.02 2.24-3.02 1.06 0 1.57.8 1.57 1.75 0 1.07-.68 2.67-1.03 4.15-.29 1.24.62 2.25 1.84 2.25 2.2 0 3.9-2.32 3.9-5.67 0-2.96-2.13-5.03-5.17-5.03-3.52 0-5.59 2.64-5.59 5.37 0 1.06.41 2.2.92 2.82.1.12.11.23.08.35-.09.38-.3 1.24-.34 1.41-.05.23-.18.27-.4.17-1.49-.7-2.43-2.88-2.43-4.64 0-3.77 2.74-7.24 7.91-7.24 4.15 0 7.38 2.96 7.38 6.91 0 4.12-2.6 7.43-6.2 7.43-1.21 0-2.35-.63-2.74-1.37l-.74 2.78c-.27 1.04-1 2.34-1.49 3.13.8.25 1.66.39 2.54.39 6.63 0 12-5.37 12-12S18.63 0 12 0z"/></svg>
            </a>
        </div>
    </div>

    <div class="y2k-footer-col">
        <h4><?php esc_html_e( 'Shop', 'y2kglobal' ); ?></h4>
        <ul>
            <li><a href="/shop"><?php esc_html_e( 'All Products', 'y2kglobal' ); ?></a></li>
            <li><a href="/product-category/tops"><?php esc_html_e( 'Tops', 'y2kglobal' ); ?></a></li>
            <li><a href="/product-category/bottoms"><?php esc_html_e( 'Bottoms', 'y2kglobal' ); ?></a></li>
            <li><a href="/product-category/dresses"><?php esc_html_e( 'Dresses', 'y2kglobal' ); ?></a></li>
            <li><a href="/product-category/accessories"><?php esc_html_e( 'Accessories', 'y2kglobal' ); ?></a></li>
            <li><a href="/sale"><?php esc_html_e( 'Sale', 'y2kglobal' ); ?></a></li>
        </ul>
    </div>

    <div class="y2k-footer-col">
        <h4><?php esc_html_e( 'Help', 'y2kglobal' ); ?></h4>
        <ul>
            <li><a href="/faq"><?php esc_html_e( 'FAQ', 'y2kglobal' ); ?></a></li>
            <li><a href="/shipping-returns"><?php esc_html_e( 'Shipping & Returns', 'y2kglobal' ); ?></a></li>
            <li><a href="/size-guide"><?php esc_html_e( 'Size Guide', 'y2kglobal' ); ?></a></li>
            <li><a href="/track-order"><?php esc_html_e( 'Track Order', 'y2kglobal' ); ?></a></li>
            <li><a href="/contact"><?php esc_html_e( 'Contact Us', 'y2kglobal' ); ?></a></li>
        </ul>
    </div>

    <div class="y2k-footer-col">
        <h4><?php esc_html_e( 'Company', 'y2kglobal' ); ?></h4>
        <ul>
            <li><a href="/about"><?php esc_html_e( 'About Us', 'y2kglobal' ); ?></a></li>
            <li><a href="/privacy-policy"><?php esc_html_e( 'Privacy Policy', 'y2kglobal' ); ?></a></li>
            <li><a href="/terms-of-service"><?php esc_html_e( 'Terms of Service', 'y2kglobal' ); ?></a></li>
        </ul>
    </div>
</div>

<div class="y2k-footer-bottom">
    <span>© <?php echo esc_html( date( 'Y' ) ); ?> Y2K Global. <?php esc_html_e( 'All rights reserved.', 'y2kglobal' ); ?></span>
    <div class="y2k-payment-icons" aria-label="<?php esc_attr_e( 'Accepted payment methods', 'y2kglobal' ); ?>">
        <span style="font-size:11px;opacity:.6;letter-spacing:.05em;">VISA &nbsp; MASTERCARD &nbsp; PAYPAL &nbsp; AMEX</span>
    </div>
</div>
