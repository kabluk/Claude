<?php
/**
 * Single product meta — Y2K Global child theme
 * Overrides: woocommerce/templates/single-product/meta.php
 */

defined( 'ABSPATH' ) || exit;

global $product;
?>

<div class="product_meta">

    <?php if ( wc_product_sku_enabled() && ( $product->get_sku() || $product->is_type( 'variable' ) ) ) : ?>
        <span class="sku_wrapper">
            <?php esc_html_e( 'SKU:', 'woocommerce' ); ?>
            <span class="sku"><?php echo $product->get_sku() ?: esc_html__( 'N/A', 'woocommerce' ); ?></span>
        </span>
    <?php endif; ?>

    <?php echo wc_get_product_category_list( $product->get_id(), ', ', '<span class="posted_in">' . _n( 'Category:', 'Categories:', count( $product->get_category_ids() ), 'woocommerce' ) . ' ', '</span>' ); ?>

    <?php echo wc_get_product_tag_list( $product->get_id(), ', ', '<span class="tagged_as">' . _n( 'Tag:', 'Tags:', count( $product->get_tag_ids() ), 'woocommerce' ) . ' ', '</span>' ); ?>

    <div class="y2k-shipping-info" style="margin-top:16px;font-size:13px;color:#6b6b6b;line-height:1.7;">
        <p>
            <strong>🚚 Shipping:</strong>
            <?php echo esc_html( get_theme_mod( 'y2k_shipping_text', '10–18 business days' ) ); ?>
        </p>
        <p>
            <strong>🔄 Returns:</strong>
            30-day hassle-free returns
        </p>
        <p>
            <strong>📦 Fulfillment:</strong>
            Ships from our international warehouse
        </p>
    </div>

</div>
