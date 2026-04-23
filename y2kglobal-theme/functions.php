<?php
defined( 'ABSPATH' ) || exit;

require_once get_stylesheet_directory() . '/inc/performance.php';
require_once get_stylesheet_directory() . '/inc/page-content.php';

/* ============================================================
   ENQUEUE STYLES & SCRIPTS
   ============================================================ */
add_action( 'wp_enqueue_scripts', 'y2k_enqueue_assets' );
function y2k_enqueue_assets() {
    // Google Fonts: Playfair Display + DM Sans
    wp_enqueue_style(
        'y2k-google-fonts',
        'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@400;600;700&display=swap',
        [],
        null
    );

    // Parent theme
    wp_enqueue_style(
        'storefront-style',
        get_template_directory_uri() . '/style.css'
    );

    // Child theme
    wp_enqueue_style(
        'y2k-style',
        get_stylesheet_uri(),
        [ 'storefront-style' ],
        wp_get_theme()->get( 'Version' )
    );

    // Main JS
    wp_enqueue_script(
        'y2k-main',
        get_stylesheet_directory_uri() . '/assets/js/main.js',
        [],
        wp_get_theme()->get( 'Version' ),
        true
    );

    // Pass ajaxurl and nonce to JS
    wp_localize_script( 'y2k-main', 'y2kData', [
        'ajaxurl' => admin_url( 'admin-ajax.php' ),
        'nonce'   => wp_create_nonce( 'y2k_nonce' ),
    ] );
}

/* ============================================================
   THEME SETUP
   ============================================================ */
add_action( 'after_setup_theme', 'y2k_theme_setup' );
function y2k_theme_setup() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'woocommerce' );
    add_theme_support( 'wc-product-gallery-zoom' );
    add_theme_support( 'wc-product-gallery-lightbox' );
    add_theme_support( 'wc-product-gallery-slider' );

    register_nav_menus( [
        'primary'  => __( 'Primary Menu', 'y2kglobal' ),
        'footer'   => __( 'Footer Menu', 'y2kglobal' ),
    ] );
}

/* ============================================================
   TRUST BAR (above header)
   ============================================================ */
add_action( 'wp_body_open', 'y2k_trust_bar', 1 );
function y2k_trust_bar() {
    ?>
    <div class="y2k-trust-bar">
        <span>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Free Shipping over $59
        </span>
        <span class="hide-mobile">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            Secure Checkout
        </span>
        <span class="hide-mobile">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Easy Returns
        </span>
    </div>
    <?php
}

/* ============================================================
   EMAIL POPUP
   ============================================================ */
add_action( 'wp_footer', 'y2k_email_popup' );
function y2k_email_popup() {
    // Don't show on checkout
    if ( function_exists( 'is_checkout' ) && is_checkout() ) return;
    get_template_part( 'template-parts/email-popup' );
}

/* ============================================================
   SIZE GUIDE MODAL
   ============================================================ */
add_action( 'wp_footer', 'y2k_size_guide_modal' );
function y2k_size_guide_modal() {
    if ( ! function_exists( 'is_product' ) || ! is_product() ) return;
    get_template_part( 'template-parts/size-guide' );
}

/* ============================================================
   SINGLE PRODUCT: shipping badge + size guide link + trust icons
   ============================================================ */
add_action( 'woocommerce_before_add_to_cart_button', 'y2k_product_shipping_badge', 5 );
function y2k_product_shipping_badge() {
    ?>
    <div class="y2k-shipping-badge">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7H4a2 2 0 00-2 2v7a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21a2 2 0 100-4 2 2 0 000 4zM8 21a2 2 0 100-4 2 2 0 000 4z"/></svg>
        <span>Estimated delivery: <strong>10–18 business days</strong></span>
    </div>
    <?php
}

add_action( 'woocommerce_before_add_to_cart_button', 'y2k_product_size_guide_link', 15 );
function y2k_product_size_guide_link() {
    global $product;
    if ( ! $product || ! $product->is_type( 'variable' ) ) return;
    echo '<button type="button" class="y2k-size-guide-link" data-modal="size-guide">📏 Size Guide</button>';
}

add_action( 'woocommerce_after_add_to_cart_button', 'y2k_product_trust_icons' );
function y2k_product_trust_icons() {
    ?>
    <div class="y2k-product-trust">
        <span class="y2k-product-trust__item">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            Secure Payment
        </span>
        <span class="y2k-product-trust__item">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Free Returns
        </span>
        <span class="y2k-product-trust__item">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            Support 24/7
        </span>
    </div>
    <?php
}

/* ============================================================
   PRODUCT CARD: second image on hover
   ============================================================ */
add_action( 'woocommerce_before_shop_loop_item_title', 'y2k_product_card_secondary_image', 11 );
function y2k_product_card_secondary_image() {
    global $product;
    if ( ! $product ) return;

    $gallery_ids = $product->get_gallery_image_ids();
    if ( empty( $gallery_ids ) ) return;

    $img_url = wp_get_attachment_image_url( $gallery_ids[0], 'woocommerce_single' );
    if ( ! $img_url ) return;

    echo '<img src="' . esc_url( $img_url ) . '" class="product-card__image-secondary" alt="" loading="lazy">';
}

/* ============================================================
   REMOVE STOREFRONT DEFAULTS THAT CONFLICT
   ============================================================ */
add_action( 'init', 'y2k_storefront_cleanup' );
function y2k_storefront_cleanup() {
    // Remove default storefront header styles that override ours
    remove_action( 'wp_head', 'storefront_header_styles' );
}

/* ============================================================
   WOOCOMMERCE: show product brand above title
   ============================================================ */
add_action( 'woocommerce_single_product_summary', 'y2k_product_brand', 3 );
function y2k_product_brand() {
    global $product;
    $brand = get_post_meta( $product->get_id(), '_brand', true );
    if ( $brand ) {
        echo '<p class="y2k-product-brand">' . esc_html( $brand ) . '</p>';
    } else {
        echo '<p class="y2k-product-brand">Y2K Global</p>';
    }
}

/* ============================================================
   AJAX: save email to newsletter list
   ============================================================ */
add_action( 'wp_ajax_nopriv_y2k_subscribe', 'y2k_handle_subscribe' );
add_action( 'wp_ajax_y2k_subscribe', 'y2k_handle_subscribe' );
function y2k_handle_subscribe() {
    check_ajax_referer( 'y2k_nonce', 'nonce' );

    $email = isset( $_POST['email'] ) ? sanitize_email( $_POST['email'] ) : '';

    if ( ! is_email( $email ) ) {
        wp_send_json_error( [ 'message' => 'Invalid email address.' ] );
    }

    // Save to WooCommerce newsletter list via custom option
    $subscribers = get_option( 'y2k_email_subscribers', [] );
    if ( ! in_array( $email, $subscribers, true ) ) {
        $subscribers[] = $email;
        update_option( 'y2k_email_subscribers', $subscribers );
    }

    // Also subscribe in Mailchimp if API key is configured
    $mailchimp_key      = get_option( 'y2k_mailchimp_api_key', '' );
    $mailchimp_list_id  = get_option( 'y2k_mailchimp_list_id', '' );
    if ( $mailchimp_key && $mailchimp_list_id ) {
        y2k_mailchimp_subscribe( $email, $mailchimp_key, $mailchimp_list_id );
    }

    wp_send_json_success( [ 'message' => 'Thanks! Check your inbox for your discount code.' ] );
}

function y2k_mailchimp_subscribe( $email, $api_key, $list_id ) {
    $dc       = substr( strrchr( $api_key, '-' ), 1 );
    $endpoint = "https://{$dc}.api.mailchimp.com/3.0/lists/{$list_id}/members";

    wp_remote_post( $endpoint, [
        'headers' => [
            'Authorization' => 'Basic ' . base64_encode( 'anystring:' . $api_key ),
            'Content-Type'  => 'application/json',
        ],
        'body' => wp_json_encode( [
            'email_address' => $email,
            'status'        => 'subscribed',
        ] ),
        'timeout' => 10,
    ] );
}

/* ============================================================
   CUSTOMIZER: site settings
   ============================================================ */
add_action( 'customize_register', 'y2k_customizer_settings' );
function y2k_customizer_settings( $wp_customize ) {
    $wp_customize->add_section( 'y2k_settings', [
        'title'    => __( 'Y2K Global Settings', 'y2kglobal' ),
        'priority' => 30,
    ] );

    // Hero image
    $wp_customize->add_setting( 'y2k_hero_image', [ 'sanitize_callback' => 'esc_url_raw' ] );
    $wp_customize->add_control( new WP_Customize_Image_Control( $wp_customize, 'y2k_hero_image', [
        'label'   => __( 'Homepage Hero Image', 'y2kglobal' ),
        'section' => 'y2k_settings',
    ] ) );

    // Hero title
    $wp_customize->add_setting( 'y2k_hero_title', [ 'sanitize_callback' => 'sanitize_text_field', 'default' => 'The New Wave\nIs Here' ] );
    $wp_customize->add_control( 'y2k_hero_title', [
        'label'   => __( 'Hero Title', 'y2kglobal' ),
        'section' => 'y2k_settings',
        'type'    => 'text',
    ] );

    // Hero CTA
    $wp_customize->add_setting( 'y2k_hero_cta_text', [ 'sanitize_callback' => 'sanitize_text_field', 'default' => 'Shop Now' ] );
    $wp_customize->add_control( 'y2k_hero_cta_text', [
        'label'   => __( 'Hero Button Text', 'y2kglobal' ),
        'section' => 'y2k_settings',
        'type'    => 'text',
    ] );

    $wp_customize->add_setting( 'y2k_hero_cta_url', [ 'sanitize_callback' => 'esc_url_raw', 'default' => '/shop' ] );
    $wp_customize->add_control( 'y2k_hero_cta_url', [
        'label'   => __( 'Hero Button URL', 'y2kglobal' ),
        'section' => 'y2k_settings',
        'type'    => 'url',
    ] );

    // Popup discount code
    $wp_customize->add_setting( 'y2k_popup_discount', [ 'sanitize_callback' => 'sanitize_text_field', 'default' => 'WELCOME10' ] );
    $wp_customize->add_control( 'y2k_popup_discount', [
        'label'   => __( 'Popup Discount Code', 'y2kglobal' ),
        'section' => 'y2k_settings',
        'type'    => 'text',
    ] );

    // Shipping time text
    $wp_customize->add_setting( 'y2k_shipping_text', [ 'sanitize_callback' => 'sanitize_text_field', 'default' => '10–18 business days' ] );
    $wp_customize->add_control( 'y2k_shipping_text', [
        'label'   => __( 'Shipping Time Text', 'y2kglobal' ),
        'section' => 'y2k_settings',
        'type'    => 'text',
    ] );
}

/* ============================================================
   HOMEPAGE TEMPLATE SHORTCODES
   ============================================================ */
add_shortcode( 'y2k_hero', 'y2k_hero_shortcode' );
function y2k_hero_shortcode() {
    $img   = get_theme_mod( 'y2k_hero_image', '' );
    $title = get_theme_mod( 'y2k_hero_title', "The New Wave\nIs Here" );
    $cta   = get_theme_mod( 'y2k_hero_cta_text', 'Shop Now' );
    $url   = get_theme_mod( 'y2k_hero_cta_url', '/shop' );

    ob_start();
    ?>
    <section class="y2k-hero">
        <?php if ( $img ) : ?>
            <img class="y2k-hero__img" src="<?php echo esc_url( $img ); ?>" alt="Hero" loading="eager">
        <?php endif; ?>
        <div class="y2k-hero__overlay"></div>
        <div class="y2k-hero__content">
            <p class="y2k-hero__eyebrow">New Collection</p>
            <h1 class="y2k-hero__title"><?php echo nl2br( esc_html( $title ) ); ?></h1>
            <a href="<?php echo esc_url( $url ); ?>" class="y2k-hero__cta"><?php echo esc_html( $cta ); ?></a>
        </div>
    </section>
    <?php
    return ob_get_clean();
}

/* ============================================================
   WOOCOMMERCE: disable Storefront sidebar on shop pages
   ============================================================ */
add_filter( 'storefront_layout', 'y2k_no_sidebar' );
function y2k_no_sidebar() {
    if ( is_shop() || is_product_category() || is_product() ) {
        return 'full-width';
    }
    return 'right';
}

/* ============================================================
   PERFORMANCE: disable block editor styles on frontend
   ============================================================ */
add_action( 'wp_enqueue_scripts', 'y2k_dequeue_block_styles', 100 );
function y2k_dequeue_block_styles() {
    wp_dequeue_style( 'wp-block-library' );
    wp_dequeue_style( 'wp-block-library-theme' );
    wp_dequeue_style( 'global-styles' );
    wp_dequeue_style( 'classic-theme-styles' );
}
