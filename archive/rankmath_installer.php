<?php

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);



define('WP_USE_THEMES', false);
require_once(__DIR__ . '/wp-load.php');

$auth_path = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';
require_once($auth_path);
verify_api_token();

require_once(ABSPATH . 'wp-admin/includes/plugin.php');
require_once(ABSPATH . 'wp-admin/includes/file.php');
require_once(ABSPATH . 'wp-admin/includes/misc.php');
require_once(ABSPATH . 'wp-admin/includes/class-wp-upgrader.php');

$plugin_slug = 'seo-by-rank-math';
$plugin_file = 'seo-by-rank-math/rank-math.php';

$results = [];

if (!is_plugin_active($plugin_file)) {
    if (!file_exists(WP_PLUGIN_DIR . '/' . $plugin_slug)) {
        // Get plugin info
        $api = plugins_api('plugin_information', array(
            'slug' => $plugin_slug,
            'fields' => array(
                'short_description' => false,
                'sections' => false,
                'requires' => false,
                'rating' => false,
                'ratings' => false,
                'downloaded' => false,
                'last_updated' => false,
                'added' => false,
                'tags' => false,
                'compatibility' => false,
                'homepage' => false,
                'donate_link' => false,
            ),
        ));

        if (is_wp_error($api)) {
            die(json_encode(['success' => false, 'error' => $api->get_error_message()]));
        }

        ob_start();
        $upgrader = new Plugin_Upgrader(new Automatic_Upgrader_Skin());
        $installed = $upgrader->install($api->download_link);
        $output = ob_get_clean();

        if (is_wp_error($installed)) {
            die(json_encode(['success' => false, 'error' => $installed->get_error_message(), 'output' => $output]));
        }
        $results[] = "Plugin downloaded and installed.";
    }
    
    $activated = activate_plugin($plugin_file);
    if (is_wp_error($activated)) {
         die(json_encode(['success' => false, 'error' => $activated->get_error_message()]));
    }
    $results[] = "Plugin activated.";
} else {
    $results[] = "Plugin is already installed and active.";
}

// Basic Configuration
$options = get_option('rank-math-options-general', []);
$options['breadcrumbs'] = 'off';
update_option('rank-math-options-general', $options);

echo json_encode(['success' => true, 'results' => $results]);
?>
