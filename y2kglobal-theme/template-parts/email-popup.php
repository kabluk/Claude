<?php
defined( 'ABSPATH' ) || exit;
$discount = get_theme_mod( 'y2k_popup_discount', 'WELCOME10' );
?>

<div class="y2k-popup-overlay" id="y2k-popup-overlay" role="presentation"></div>

<div
    class="y2k-popup"
    id="y2k-popup"
    role="dialog"
    aria-modal="true"
    aria-labelledby="y2k-popup-title"
    data-discount="<?php echo esc_attr( $discount ); ?>"
>
    <button class="y2k-popup__close" data-close-popup aria-label="<?php esc_attr_e( 'Close', 'y2kglobal' ); ?>">×</button>

    <img
        class="y2k-popup__img"
        src="<?php echo esc_url( get_stylesheet_directory_uri() . '/assets/images/popup-model.jpg' ); ?>"
        alt=""
        loading="lazy"
    >

    <div class="y2k-popup__body">
        <p class="y2k-popup__eyebrow"><?php esc_html_e( 'Limited time offer', 'y2kglobal' ); ?></p>

        <h2 class="y2k-popup__title" id="y2k-popup-title">
            <?php esc_html_e( 'Get 10% Off Your First Order', 'y2kglobal' ); ?>
        </h2>

        <p class="y2k-popup__sub">
            <?php esc_html_e( 'Join the Y2K Global community and be the first to know about new drops, exclusive deals, and style inspo.', 'y2kglobal' ); ?>
        </p>

        <form class="y2k-popup__form" id="y2k-popup-form" novalidate>
            <input
                type="email"
                name="email"
                required
                placeholder="<?php esc_attr_e( 'your@email.com', 'y2kglobal' ); ?>"
                autocomplete="email"
            >
            <button type="submit">
                <?php esc_html_e( 'Get My Discount', 'y2kglobal' ); ?>
            </button>
        </form>

        <button class="y2k-popup__skip" data-close-popup type="button">
            <?php esc_html_e( 'No thanks, I\'ll pay full price', 'y2kglobal' ); ?>
        </button>
    </div>
</div>
