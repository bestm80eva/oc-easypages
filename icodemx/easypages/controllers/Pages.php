<?php namespace Icodemx\EasyPages\Controllers;

use Lang;
use Flash;
use Request;
use BackendMenu;
use Cms\Classes\Theme;
use Backend\Classes\Controller;
use Icodemx\EasyPages\Widgets\PageList;
use Icodemx\EasyPages\Models\Page as Model;

/**
 * Pages Back-end Controller
 */
class Pages extends Controller
{
    public $implement = [
        'Backend.Behaviors.FormController'
    ];

    protected $theme;

    public $formConfig = 'config_form.yaml';
    public $requiredPermissions = ['icodemx.easypages.*'];

    public function __construct()
    {
        parent::__construct();

        BackendMenu::setContext('Icodemx.EasyPages', 'easypages', 'pages');
        try {
            if (!($this->theme = Theme::getEditTheme())) {
                throw new ApplicationException(Lang::get('cms::lang.theme.edit.not_found'));
            }
            $pageList = new PageList($this, []);
            $pageList->alias = 'pageList';

        } catch (Exception $ex) {
            \Log::info($ex->getMessage());
        }
    }

    public function index()
    {
        $this->addJs('/modules/backend/assets/js/october.treeview.js', 'core');
        $this->addJs('/plugins/icodemx/easypages/assets/js/pages-page.js');
        $this->addJs('/plugins/icodemx/easypages/assets/js/pages-snippets.js');
        $this->addCss('/plugins/icodemx/easypages/assets/css/pages.css');
        $this->addJs('/modules/backend/formwidgets/codeeditor/assets/js/build-min.js', 'core');
        $this->bodyClass = 'compact-container side-panel-not-fixed';
        $this->pageTitle = 'arzola.ospages::lang.plugin.name';
    }

    public function create($parent = null)
    {
        $this->addJs('/modules/backend/assets/js/october.treeview.js', 'core');
        $this->addJs('/plugins/icodemx/easypages/assets/js/pages-page.js');
        $this->addJs('/plugins/dggtic/homebuilder/assets/js/jquery.form.js');
        $this->addJs('/plugins/icodemx/easypages/assets/js/pages-snippets.js');
        $this->addJs('/plugins/icodemx/easypages/assets/js/pages-fancy.js');
        $this->addCss('/plugins/icodemx/easypages/assets/css/pages.css');
        $this->addCss('/plugins/icodemx/easypages/assets/css/sites.css');
        $this->bodyClass = 'compact-container side-panel-not-fixed';
        $this->asExtension('FormController')->create();
        if (is_numeric($parent)) {
            $this->vars['objectParent'] = Model::find($parent);
            $this->vars['parentId'] = $parent;
        }
        $this->vars['objectId'] = null;
        $this->vars['object'] = new Model();
    }

    public function update($record)
    {
        $this->vars['object'] = Model::findOrFail($record);
        $this->addJs('/modules/backend/assets/js/october.treeview.js', 'core');
        $this->addJs('/plugins/icodemx/easypages/assets/js/pages-page.js');
        $this->addJs('/plugins/dggtic/homebuilder/assets/js/jquery.form.js');
        $this->addJs('/plugins/icodemx/easypages/assets/js/pages-snippets.js');
        $this->addJs('/plugins/icodemx/easypages/assets/js/pages-fancy.js');
        $this->addCss('/plugins/icodemx/easypages/assets/css/pages.css');
        $this->addCss('/plugins/icodemx/easypages/assets/css/sites.css');
        $this->bodyClass = 'compact-container side-panel-not-fixed';
        $this->vars['parentId'] = $this->vars['object']->getParentId();
        $this->vars['currentId'] = $record;
        $this->vars['objectId'] = $record;
        $this->asExtension('FormController')->update($record);
    }

    public function formAfterSave($model)
    {
        $model->user_id = $this->user->id;
        $model->save();
    }

    public function onDeleteObjects()
    {
        $this->validateRequestTheme();

        $objects = Request::input('object');

        $error = null;
        $deleted = [];

        try {
            foreach ($objects as $id => $val) {
                $deletedObject = Model::remove($id);
                $deleted[] = array('id' => $id, 'status' => $deletedObject);
            }
        } catch (Exception $ex) {
            $error = $ex->getMessage();
        }

        return [
            'deleted' => $deleted,
            'error' => $error,
            'theme' => Request::input('theme')
        ];
    }

    public function onDelete()
    {
        $object = Request::input('objectId');
        Model::remove($object);
        return [
            'deletedObjects' => [['id' => $object]]
        ];
    }
}