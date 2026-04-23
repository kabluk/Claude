<?php defined( 'ABSPATH' ) || exit; ?>

<div class="y2k-modal-overlay" id="y2k-size-guide-overlay" role="dialog" aria-modal="true" aria-labelledby="y2k-size-guide-title">
    <div class="y2k-modal">
        <button class="y2k-modal__close" data-close-modal aria-label="<?php esc_attr_e( 'Close', 'y2kglobal' ); ?>">×</button>

        <h2 class="y2k-modal__title" id="y2k-size-guide-title">
            <?php esc_html_e( 'Size Guide', 'y2kglobal' ); ?>
        </h2>

        <p style="font-size:13px;color:#6b6b6b;margin-bottom:16px;">
            <?php esc_html_e( 'All measurements are in centimetres. If you\'re between sizes, we recommend sizing up.', 'y2kglobal' ); ?>
        </p>

        <h3 style="font-size:14px;font-family:var(--font-heading);margin:0 0 8px;">
            <?php esc_html_e( 'Tops & Dresses', 'y2kglobal' ); ?>
        </h3>
        <table class="y2k-size-table">
            <thead>
                <tr>
                    <th><?php esc_html_e( 'Size', 'y2kglobal' ); ?></th>
                    <th><?php esc_html_e( 'Bust (cm)', 'y2kglobal' ); ?></th>
                    <th><?php esc_html_e( 'Waist (cm)', 'y2kglobal' ); ?></th>
                    <th><?php esc_html_e( 'Hips (cm)', 'y2kglobal' ); ?></th>
                    <th><?php esc_html_e( 'US Size', 'y2kglobal' ); ?></th>
                </tr>
            </thead>
            <tbody>
                <tr><td>XS</td><td>80–84</td><td>60–64</td><td>86–90</td><td>0–2</td></tr>
                <tr><td>S</td><td>84–88</td><td>64–68</td><td>90–94</td><td>4–6</td></tr>
                <tr><td>M</td><td>88–92</td><td>68–72</td><td>94–98</td><td>8–10</td></tr>
                <tr><td>L</td><td>92–96</td><td>72–76</td><td>98–102</td><td>12–14</td></tr>
                <tr><td>XL</td><td>96–100</td><td>76–80</td><td>102–106</td><td>16–18</td></tr>
            </tbody>
        </table>

        <h3 style="font-size:14px;font-family:var(--font-heading);margin:24px 0 8px;">
            <?php esc_html_e( 'Bottoms & Jeans', 'y2kglobal' ); ?>
        </h3>
        <table class="y2k-size-table">
            <thead>
                <tr>
                    <th><?php esc_html_e( 'Size', 'y2kglobal' ); ?></th>
                    <th><?php esc_html_e( 'Waist (cm)', 'y2kglobal' ); ?></th>
                    <th><?php esc_html_e( 'Hips (cm)', 'y2kglobal' ); ?></th>
                    <th><?php esc_html_e( 'Inseam (cm)', 'y2kglobal' ); ?></th>
                </tr>
            </thead>
            <tbody>
                <tr><td>XS / 24</td><td>60–64</td><td>86–90</td><td>76</td></tr>
                <tr><td>S / 26</td><td>64–68</td><td>90–94</td><td>77</td></tr>
                <tr><td>M / 28</td><td>68–72</td><td>94–98</td><td>78</td></tr>
                <tr><td>L / 30</td><td>72–76</td><td>98–102</td><td>79</td></tr>
                <tr><td>XL / 32</td><td>76–80</td><td>102–106</td><td>80</td></tr>
            </tbody>
        </table>

        <p style="font-size:12px;color:#6b6b6b;margin-top:20px;">
            <?php esc_html_e( 'Sizing varies by style. Questions? Contact us at ', 'y2kglobal' ); ?>
            <a href="mailto:support@y2kglobal.com">support@y2kglobal.com</a>
        </p>
    </div>
</div>
