<?php
namespace Icodemx\EasyPages\Widgets;

use Input;
use Cms\Classes\Theme;
use Backend\Classes\WidgetBase;
use Backend\Facades\BackendAuth;
use Icodemx\EasyPages\Models\Page as Model;


/**
 *
 * Widget PageList
 *
 * This file is created to show Pages in the backend to manage
 *
 * @package    Icodemx
 * @subpackage Icodemx/EasyPages/Widgets
 * @author Oscar Arzola <os@icode.mx>
 */

class PageList extends WidgetBase
{

    use \Backend\Traits\SearchableWidget;
    use \Backend\Traits\CollapsableWidget;
    use \Backend\Traits\SelectableWidget;

    protected $theme;

    protected $defaultAlias = 'pageList';

    protected $dataIdPrefix;

    public $user;

    public $usergroup;

    public $mandatoryOnly = false;

    public $deleteConfirmation = 'arzola.ospages::lang.page.delete_confirmation';

    public $noRecordsMessage = 'arzola.ospages::lang.page.no_records';

    public $addSubpageLabel = 'arzola.ospages::lang.page.add_subpage';

    public function __construct($controller, array $configuration)
    {
        $this->theme = Theme::getEditTheme();
        parent::__construct($controller, $configuration);
        $this->bindToController();
        $this->user = BackendAuth::getUser();
    }

    public function isAllowedToCreate()
    {
        return true;
    }

    /**
     * Renders the widget.
     * @return string
     */
    public function render()
    {
        return $this->makePartial('body', [
            'data' => $this->getData(), 'allowed' => $this->isAllowedToCreate()
        ]);
    }

    /*
     * Methods for th internal use
     */

    protected function getData($others = false)
    {
        if ($this->mandatoryOnly && !$others) {
            $pages = Model::getTree($this->getSearchTerm(), Model::getMandatoryElements());
        } else {
            $pages = Model::getTree($this->getSearchTerm(), null, true);
        }
        return $pages;
    }


    public function onReorder()
    {
        $items = json_decode(Input::get('structure'), true);
    }

    public function onReorderSubpages()
    {
        $items = json_decode(Input::get('structure'), true);
        $this->reorder($items, 0);
    }

    protected function reorder($items, $parent)
    {
        if (count($items) == 0)
            return;
        $parent = ($parent != 0) ? $parent : 0;
        foreach ($items as $item => $children) {
            Model::updateParentAndOrder($item, $parent, $children['order']);
            $this->reorder($children['nodos'], $item);
        }
    }

    public function onUpdate()
    {
        $this->extendSelection();

        return $this->updateList();
    }

    public function onSearch()
    {
        $this->setSearchTerm(Input::get('search'));
        $this->extendSelection();

        return $this->updateList();
    }

    protected function updateList()
    {
        return ['#' . $this->getId('page-list') =>
            $this->makePartial('items', ['items' => $this->getData()])
        ];
    }

}