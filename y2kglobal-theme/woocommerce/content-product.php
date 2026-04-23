<?php
/**
 * Product card template — Y2K Global child theme
 * Overrides: woocommerce/templates/content-product.php
 */

defined( 'ABSPATH' ) || exit;

global $product;

if ( empty( $product ) || ! $product->is_visible() ) return;

$gallery_ids   = $product->get_gallery_image_ids();
$secondary_url = ! empty( $gallery_ids ) ? wp_get_attachment_image_url( $gallery_ids[0], 'woocommerce_single' ) : '';
$is_on_sale    = $product->is_on_sale();
?>

<li <?php wc_product_class( 'product-card', $product ); ?>>
    <a href="<?php echo esc_url( get_permalink() ); ?>" class="product-card__link" aria-label="<?php echo esc_attr( $product->get_name() ); ?>">

        <div class="product-card__image-wrap">
            <?php if ( $is_on_sale ) : ?>
                <span class="product-card__badge">Sale</span>
            <?php endif; ?>

            <?php
            echo woocommerce_get_product_thumbnail( 'woocommerce_single', [
                'class' => 'product-card__image-primary',
            ] );
            ?>

            <?php if ( $secondary_url ) : ?>
                <img
                    src="<?php echo esc_url( $secondary_url ); ?>"
                    class="product-card__image-secondary"
                    alt=""
                    loading="lazy"
                    width="600"
                    height="800"
                >
            <?php endif; ?>

            <?php if ( $product->is_type( 'simple' ) ) : ?>
                <button
                    class="product-card__quick-add ajax_add_to_cart"
                    data-product_id="<?php echo esc_attr( $product->get_id() ); ?>"
                    data-quantity="1"
                    type="button"
                    aria-label="<?php esc_attr_e( 'Add to cart', 'y2kglobal' ); ?>"
                >
                    <?php esc_html_e( 'Add to Cart', 'y2kglobal' ); ?>
                </button>
            <?php else : ?>
                <span class="product-card__quick-add">
                    <?php esc_html_e( 'Select Options', 'y2kglobal' ); ?>
                </span>
            <?php endif; ?>
        </div>

        <div class="product-card__info">
            <p class="product-card__name"><?php echo esc_html( $product->get_name() ); ?></p>
            <p class="product-card__price"><?php echo wp_kses_post( $product->get_price_html() ); ?></p>
        </div>

    </a>
</li>
