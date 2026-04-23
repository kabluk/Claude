<?php
/**
 * Performance optimizations for Y2K Global
 */
defined( 'ABSPATH' ) || exit;

/* Remove unnecessary WordPress head elements */
remove_action( 'wp_head', 'wp_generator' );
remove_action( 'wp_head', 'wlwmanifest_link' );
remove_action( 'wp_head', 'rsd_link' );
remove_action( 'wp_head', 'wp_shortlink_wp_head' );
remove_action( 'wp_head', 'adjacent_posts_rel_link_wp_head' );

/* Disable Gutenberg block editor styles on frontend */
add_filter( 'should_load_separate_core_block_assets', '__return_false' );

/* Add preconnect hints for Google Fonts */
add_action( 'wp_head', 'y2k_resource_hints', 1 );
function y2k_resource_hints() {
    echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
    echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
}

/* Defer non-critical JS */
add_filter( 'script_loader_tag', 'y2k_defer_scripts', 10, 3 );
function y2k_defer_scripts( $tag, $handle, $src ) {
    $defer = [ 'y2k-main', 'wc-add-to-cart', 'wc-add-to-cart-variation' ];
    if ( in_array( $handle, $defer, true ) ) {
        return str_replace( ' src=', ' defer src=', $tag );
    }
    return $tag;
}

/* WebP support detection via cookie */
add_action( 'wp_head', 'y2k_webp_detection', 0 );
function y2k_webp_detection() {
    echo '<script>document.cookie="webp="+(document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp")===0?"1":"0")+";path=/";</script>' . "\n";
}
