<?php
/**
 * Plugin Name: Evergreen Homepage Custom CSS
 * Description: Loads custom CSS + icon overrides for homepage parity with Stitch design system
 * Version: 5.0.0
 */

// 1. Load external CSS + Material Symbols font
add_action('wp_enqueue_scripts', function() {
    if (is_front_page() || is_page(1758)) {
        // Material Symbols font
        wp_enqueue_style(
            'material-symbols-outlined',
            'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
            array(),
            null,
            'all'
        );
        
        // Custom CSS
        wp_enqueue_style(
            'evergreen-homepage-custom',
            home_url('/wp-content/uploads/evergreen-homepage-custom.css'),
            array('elementor-frontend'),
            '5.0.0',
            'all'
        );
    }
}, 9999);

// 2. Inject CTA gradient + Material Symbols icon overrides via JS
add_action('wp_footer', function() {
    if (!is_front_page() && !is_page(1758)) return;
    echo '<script id="evergreen-homepage-fix">
(function(){
    // CTA gradient fix
    var cta = document.querySelector("[data-id=\"69a22305\"]");
    if(cta){
        cta.style.setProperty("background-image","linear-gradient(135deg, #1D8A43 0%, #28B5E1 100%)","important");
        cta.style.setProperty("background-color","#1D8A43","important");
        cta.style.setProperty("border-radius","16px","important");
        cta.style.setProperty("overflow","hidden","important");
        var inner = cta.querySelector(".e-con-inner");
        if(inner){
            inner.style.setProperty("background","transparent","important");
        }
    }
    
    // Value Props icon override: replace FA icons with Material Symbols
    var iconMap = {
        "icon_29302187": "sailing",
        "icon_44db5797": "verified",
        "icon_7e4cf3f7": "engineering"
    };
    
    Object.entries(iconMap).forEach(function(entry){
        var widgetId = entry[0];
        var symbolName = entry[1];
        var widget = document.querySelector("[data-id=\"" + widgetId + "\"]");
        if(widget){
            var iconContainer = widget.querySelector(".elementor-icon");
            if(iconContainer){
                // Replace FA icon with Material Symbol
                iconContainer.innerHTML = "<span class=\"material-symbols-outlined\" style=\"font-size:inherit;color:inherit;\">" + symbolName + "</span>";
                // Ensure proper styling
                iconContainer.style.setProperty("display","flex","important");
                iconContainer.style.setProperty("align-items","center","important");
                iconContainer.style.setProperty("justify-content","center","important");
            }
        }
    });

    // Category card icons (text-only cards with FA icons)
    // Stitch uses: lightbulb, highlight, traffic, wall_lamp, filter_center_focus, factory
    var catIcons = document.querySelectorAll("[data-id=\"7ebc3f4b\"] .elementor-widget-icon .elementor-icon");
    var catSymbols = ["lightbulb", "highlight", "traffic", "wall_lamp", "filter_center_focus", "factory"];
    catIcons.forEach(function(el, i){
        if(catSymbols[i]){
            el.innerHTML = "<span class=\"material-symbols-outlined\" style=\"font-size:inherit;color:inherit;\">" + catSymbols[i] + "</span>";
            el.style.setProperty("display","flex","important");
            el.style.setProperty("align-items","center","important");
            el.style.setProperty("justify-content","center","important");
        }
    });
})();
</script>';
}, 99999);
