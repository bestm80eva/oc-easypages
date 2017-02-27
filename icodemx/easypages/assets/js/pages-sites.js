$(document).ready(function(){

  $('.duplicable').hide();

    $('#relContent-type-select').change(function(){
        var section = $(this).closest('.Section-form.duplicable');
        var value = $(this).val();

        section.find('.relContent-type').hide();
        $('#relContent-'+value).show();
    });


    $('.new-component-multi').click(function(e){
        e.preventDefault();
        var related = $(this).attr('rel');
        $('#component'+related).show();
    });
});