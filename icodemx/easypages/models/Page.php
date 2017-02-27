<?php namespace Icodemx\EasyPages\Models;

use Model;
use October\Rain\Database\Traits\SimpleTree;
use October\Rain\Database\Traits\Validation;
use Config;

/**
 *
 * Model Icodemx/EasyPages
 *
 * Database Model for Pages
 *
 * @package    Icodemx
 * @subpackage Icodemx/EasyPages
 * @author Oscar Arzola <os@icode.mx>
 */

class Page extends Model
{
    use Validation;
    use SimpleTree;
    /**
     * @var string The database table used by the model.
     */
    public $table = 'icodemx_easypages_pages';

    /**
     * @var array Guarded fields
     */
    protected $guarded = ['*'];

    /**
     * @var array Fillable fields
     */
    protected $fillable = ['title', 'slug', 'mandatory_page', 'parent_id', 'user_id', 'excerpt'];

    public $rules = [
        'title' => 'required|min:3|max:100',
        'title_menu' => 'required|min:5|max:100',
        'slug' => ['required', 'regex:/^[a-z0-9\/\:_\-\*\[\]\+\?\|]*$/i'],
        'external_url' => ['active_url']
    ];

    /**
     * @var array Relations
     */
    public $hasOne = [];
    public $hasMany = [
        'children' => ['Icodemx\EasyPages\Models\Page', 'key' => 'parent_id'],
    ];
    public $belongsTo = [
        'parent' => ['Icodemx\EasyPages\Models\Page', 'key' => 'parent_id']
    ];
    public $belongsToMany = [];
    public $morphTo = [];
    public $morphOne = [];
    public $morphMany = [];
    public $attachOne = [];
    public $attachMany = [
        'images' => ['System\Models\File']
    ];

    public function setParentIdAttribute($value)
    {
        $parent = (is_numeric(\Request::segment(6))) ? \Request::segment(6) : $value;
        $parent = (empty($parent)) ? 0 : (int)$parent;
        $this->attributes['parent_id'] = ($this->exists) ? $this->parent_id : $parent;
    }

    public static function buildTree(array $elements, $parentId = 0)
    {
        $branch = array();

        if (count($elements) == 1) {
            $branch[] = $elements[0];
            $branch[0]['subpages'] = [];
            return $branch;
        }

        foreach ($elements as $element) {
            if ($element['parent_id'] == $parentId) {
                $children = self::buildTree($elements, $element['id']);

                if ($children) {
                    $element['subpages'] = $children;
                } else {
                    $element['subpages'] = [];
                }

                $branch[] = $element;
            }
        }
        return $branch;
    }

    public static function getTree($where = null, $roots = null)
    {
        $like = (Config::get('database.default') == 'pgsql') ? 'ilike' : 'like'; //postgress ilike tweak
        $query = Page::menuOrder();
        if ($where) {
            $query->where(function ($q) use ($like, $where) {
                $q->where('title', $like, '%' . $where . '%');
            });
        }
        if (is_array($roots)) {
            $query->where(function ($q) use ($roots) {
                $q->wherein('id', $roots);
                $q->orwherein('parent_id', $roots);
            });
        }
        $unordered = $query->get()->sortBy('menu_order'); //TODO [PERFORMANCE] Review performance
        return self::buildTree(($unordered) ? $unordered->toArray() : []);
    }

    public static function getParent($id = null)
    {
        return ($id) ? self::where('id', '=', $id)->first() : null;
    }

    public static function getRecord($id = null)
    {
        return ($id) ? self::where('id', '=', $id)->first() : null;
    }

    public function getParentElement()
    {
        $id = ($this->getParentId()) ? $this->getParentId() : 0;
        return ($id) ? self::where('id', '=', $id)->first() : null;
    }

    public static function remove($pageId)
    {
        //Manually do this to avoid conflicts with softDeleting
        $toDelete = Page::find($pageId);
        $children = Page::where('parent_id', '=', $toDelete->id)->get();
        $children->each(function ($e) {
            $e->images->each(function ($img) {
                $img->delete();
            });
            $e->delete();
        });
        return $toDelete->delete();
    }

    public function beforeValidate()
    {
        if ($this->title_menu == '') {
            $this->title_menu = $this->title;
        }
    }

    /*
     * Useful scopes
     */

    public function scopeIsRoot($query)
    {
        return $query->where(function ($query) {
            $query->where('parent_id', '=', 0);
            $query->orWhereNull('parent_id');
        });
    }

    public function scopeIsPublished($query)
    {
        return $query->where('published', '=', 1);
    }

    public function scopeMenuOrder($query)
    {
        return $query->orderBy('menu_order', 'asc');
    }

    public function subpages()
    {
        return $this->children()->orderby('menu_order', 'asc')->relevantData()->get()->sortBy('id');
    }

    public static function updateParentAndOrder($id, $parent, $order)
    {
        return Sitio::where('id', '=', $id)->update(['parent_id' => $parent, 'menu_order' => $order]);
    }

    public function scopeHasImages($query)
    {
        return $query->has('images');
    }

    public function beforeSave()
    {
        //TODO: prevent creation if controller called directly
        if ($this->id == null || $this->id == '') {
            if ($this->parent_id == 0 || $this->parent_id == null || $this->parent_id == '') {
                $last = self::where('parent_id', '=', 0)->orderBy('id', 'desc')->limit(1)->get()->first();
                if ($last)
                    $this->menu_order = $last->menu_order + 1;
            } else {
                $last = self::where('parent_id', '=', $this->parent_id)->orderBy('id', 'desc')->limit(1)->get()->first();
                if ($last)
                    $this->menu_order = $last->menu_order + 1;
            }
        }
        $this->content_html = $this->content;
    }

}