<?php namespace Icodemx\EasyPages;

use Backend;
use System\Classes\PluginBase;

/**
 * EasyPages Plugin Information File
 */
class Plugin extends PluginBase
{

    /**
     * Returns information about this plugin.
     *
     * @return array
     */
    public function pluginDetails()
    {
        return [
            'name' => 'Easy Pages',
            'description' => 'No description provided yet...',
            'author' => 'Icodemx',
            'icon' => 'icon-cubes'
        ];
    }

    /**
     * Register method, called when the plugin is first registered.
     *
     * @return void
     */
    public function register()
    {

    }

    /**
     * Boot method, called right before the request route.
     *
     * @return array
     */
    public function boot()
    {

    }

    /**
     * Registers any front-end components implemented in this plugin.
     *
     * @return array
     */
    public function registerComponents()
    {
        return []; // Remove this line to activate

        return [
            'Icodemx\EasyPages\Components\MyComponent' => 'myComponent',
        ];
    }

    /**
     * Registers any back-end permissions used by this plugin.
     *
     * @return array
     */
    public function registerPermissions()
    {
        return []; // Remove this line to activate

        return [
            'icodemx.easypages.some_permission' => [
                'tab' => 'EasyPages',
                'label' => 'Some permission'
            ],
        ];
    }

    /**
     * Registers back-end navigation items for this plugin.
     *
     * @return array
     */
    public function registerNavigation()
    {
        return [
            'easypages' => [
                'label' => 'Easy Pages',
                'url' => Backend::url('icodemx/easypages/pages'),
                'icon' => 'icon-bullseye',
                'permissions' => ['icodemx.easypages.*'],
                'order' => 500,
                'sideMenu' => [
                    'pages' => [
                        'label' => 'arzola.ospages::lang.plugin.sidemenu.pages',
                        'icon' => 'icon-sitemap',
                        'url' => Backend::url('arzola/ospages/sitio'),
                        'attributes' => ['data-menu-item' => 'pages'],
                        'permissions' => ['arzola.ospages.manage_pages'],
                    ]
                ]
            ],
        ];
    }

}
