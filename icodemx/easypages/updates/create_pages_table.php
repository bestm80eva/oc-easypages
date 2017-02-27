<?php namespace Icodemx\EasyPages\Updates;

use Schema;
use October\Rain\Database\Schema\Blueprint;
use October\Rain\Database\Updates\Migration;

class CreatePagesTable extends Migration
{
    public function up()
    {
        Schema::create('icodemx_easypages_pages', function(Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->increments('id');
            $table->integer('user_id')->unsigned()->nullable()->index();
            $table->integer('parent_id')->nullable();
            $table->string('title');
            $table->string('title_menu')->nullable();
            $table->string('external_url')->nullable();
            $table->string('slug')->index();
            $table->text('excerpt')->nullable();
            $table->text('content')->nullable();
            $table->text('content_html')->nullable();
            $table->string('template')->nullable();
            $table->integer('views')->default(0);
            $table->string('type')->default('page');
            $table->integer('important')->default(0);
            $table->integer('published')->default(0);
            $table->integer('show_menu')->default(1);
            $table->integer('show_sidebar')->default(1);
            $table->integer('menu_order')->default(1);
            $table->string('meta')->nullable();
            $table->text('meta_description')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('published_end')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('icodemx_easypages_pages');
    }
}
