<?php
/**
 * Auto-create essential store pages on theme activation.
 * Run once via: add_action( 'after_switch_theme', 'y2k_create_essential_pages' );
 */
defined( 'ABSPATH' ) || exit;

add_action( 'after_switch_theme', 'y2k_create_essential_pages' );

function y2k_create_essential_pages() {
    $pages = [
        'about' => [
            'title'   => 'About Us',
            'content' => y2k_about_content(),
        ],
        'faq' => [
            'title'   => 'FAQ',
            'content' => y2k_faq_content(),
        ],
        'shipping-returns' => [
            'title'   => 'Shipping & Returns',
            'content' => y2k_shipping_content(),
        ],
    ];

    foreach ( $pages as $slug => $data ) {
        if ( get_page_by_path( $slug ) ) continue;

        wp_insert_post( [
            'post_title'   => $data['title'],
            'post_content' => $data['content'],
            'post_status'  => 'publish',
            'post_type'    => 'page',
            'post_name'    => $slug,
        ] );
    }
}

function y2k_about_content() {
    return <<<HTML
<!-- wp:paragraph -->
<p><strong>Y2K Global</strong> was born from a love of the era that defined a generation — the bold prints, the metallic shine, the fearless confidence of the early 2000s. We curate the best Y2K-inspired fashion so you can express your most authentic self, no matter where you are in the world.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>We partner with the best suppliers to bring you high-quality pieces at fair prices. Every item in our collection is carefully selected to match the aesthetic, the quality, and the vibe that Y2K Global stands for.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Our Promise</h3>
<!-- /wp:heading -->

<!-- wp:list -->
<ul><li>✅ Quality-checked products from trusted suppliers</li><li>✅ Honest shipping times — no surprises</li><li>✅ Responsive customer support within 24 hours</li><li>✅ Easy 30-day returns</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Questions? Reach us at <a href="mailto:support@y2kglobal.com">support@y2kglobal.com</a> — we'd love to hear from you.</p>
<!-- /wp:paragraph -->
HTML;
}

function y2k_faq_content() {
    return <<<HTML
<!-- wp:heading {"level":3} -->
<h3>How long does shipping take?</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Standard international shipping takes <strong>10–18 business days</strong>. Tracking is provided for every order. Expedited options are available at checkout where applicable.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Where do you ship from?</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>We fulfil orders from our international warehouse. Products are shipped directly to you — this helps us keep prices low and offer a wider selection.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>What is your return policy?</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>We offer <strong>30-day returns</strong> on unworn items in original condition. To initiate a return, email us at <a href="mailto:returns@y2kglobal.com">returns@y2kglobal.com</a> with your order number.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>How do I find the right size?</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Check our <a href="/size-guide">Size Guide</a> for detailed measurements. If you're between sizes, we recommend sizing up. Each product page also includes specific sizing notes.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Are the products the same as shown in photos?</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Yes — we only list products with accurate photos. Slight colour variations may occur due to screen calibration differences.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Do you offer discounts?</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Yes! Subscribe to our email list for <strong>10% off your first order</strong>. We also run seasonal sales — follow us on Instagram <a href="https://instagram.com/y2kglobal">@y2kglobal</a> to stay updated.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>How do I track my order?</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p>Once your order ships, you'll receive an email with a tracking number. You can also check your order status in <a href="/my-account">My Account</a>.</p>
<!-- /wp:paragraph -->
HTML;
}

function y2k_shipping_content() {
    return <<<HTML
<!-- wp:heading {"level":2} -->
<h2>Shipping Policy</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>We ship worldwide from our international fulfilment centre. Orders are processed within <strong>1–3 business days</strong> of payment confirmation.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Region</th><th>Standard Shipping</th><th>Tracked</th></tr></thead><tbody><tr><td>USA / Canada</td><td>12–18 business days</td><td>Yes</td></tr><tr><td>Europe</td><td>10–16 business days</td><td>Yes</td></tr><tr><td>Australia / NZ</td><td>12–18 business days</td><td>Yes</td></tr><tr><td>Rest of World</td><td>14–20 business days</td><td>Yes</td></tr></tbody></table></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p><strong>Free shipping</strong> on orders over $59 USD.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2} -->
<h2>Returns Policy</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>We accept returns within <strong>30 days</strong> of delivery for unworn, unwashed items in original packaging.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Email <a href="mailto:returns@y2kglobal.com">returns@y2kglobal.com</a> with your order number and reason for return</li><li>We'll send you a return instructions within 24 hours</li><li>Refunds are processed within 5–7 business days of receiving the item</li><li>Original shipping costs are non-refundable unless the item is defective</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Defective or incorrect items? We'll send a replacement at no charge — just send us a photo.</p>
<!-- /wp:paragraph -->
HTML;
}
