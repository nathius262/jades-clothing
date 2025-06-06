(function($) {

    $.fn.countrystatecity = function(options) {
    	var options = $.extend({
				     		default : null
				    	},
				    	options
				    );
    	
    	// console.log(options);
    	
    	var count = 0;
        return this.each( function() {
        	var element_id = $(this).attr('element-id');
        	var selected_value = $(this).attr('selected-value');   
        	var id = $(this).attr('id');  		
            if(element_id == "country"){       
            	
            	if(typeof selected_value !== typeof undefined && selected_value !== false){
            		populateCountry(element_id, id, selected_value);         		
            	
		    	}else{
		    		populateCountry(element_id, id);
		    	}
		    	count++;
            }

            // else if($(this).attr('id') == 'state_id'){
            // 	populateState($(this).attr('id'));
            // }
            // else if($(this).attr('id') == 'city_id'){
            // 	populateCity($(this).attr('id'));
            // }
        });

    }
    populateCountry = function(element, id, selected = 0){
    	$("select[id='"+id+"']").prop("disabled", true);
    	$("select[id='"+id+"']").empty().append($('<option value="">Select Country</option>'));
    	return $.getJSON("/assets/json/countries.json", function(result){
	        $.each(result.countries, function(i, field){
	        	if(selected == field.id)
	        		$("select[id='"+id+"']").append($('<option selected></option>').val(field.id).html(field.name).attr('data-address_name', field.name));
	        	else
	            	$("select[id='"+id+"']").append($('<option></option>').val(field.id).html(field.name).attr('data-address_name', field.name));
	        });

	        $("select[id='"+id+"']").prop("disabled", false);
	        if(selected != 0)
	        	$("select[id='"+id+"']").trigger("change");
	    });
    }
    populateState= function(element, country_id){
    	$("#"+element).prop("disabled", true);
    	$('#'+element).empty().append($('<option value="">Select State</option>'));
    	return $.getJSON("/assets/json/states.json", function(result){
    		var isSelected = false;
	        $.each(result.states, function(i, field){
	        	if(field.country_id == country_id){
	            	var selected_value = $('#'+element).attr('selected-value');
	            	if(typeof selected_value !== typeof undefined && selected_value !== false){
	            		if(selected_value == field.id){
	            			isSelected = true;
	            			$("#"+element).append($('<option selected></option>').val(field.id).html(field.name).attr('data-address_name', field.name));
	            		}
	            		else
	            			$("#"+element).append($('<option></option>').val(field.id).html(field.name).attr('data-address_name', field.name));
	            	}else{
	            		$("#"+element).append($('<option></option>').val(field.id).html(field.name).attr('data-address_name', field.name));
	            	}
	        	}
	        });
	        $("#"+element).prop("disabled", false);
	        if(isSelected)
	        	$("#"+element).trigger("change");
	    });
    }

    populateCity = function(element, state_id){
    	$("#"+element).prop("disabled", true);
    	$('#'+element).empty().append($('<option value="">Select City</option>'));
    	return $.getJSON("/assets/json/cities.json", function(result){
	        $.each(result.cities, function(i, field){
	            if(field.state_id == state_id){
	            	var selected_value = $('#'+element).attr('selected-value');
	            	if(typeof selected_value !== typeof undefined && selected_value !== false){
	            		if(selected_value == field.id)
	            			$("#"+element).append($('<option selected></option>').val(field.id).html(field.name).attr('data-address_name', field.name));
	            		else
	            			$("#"+element).append($('<option></option>').val(field.id).html(field.name).attr('data-address_name', field.name));
	            	}else{
	            		$("#"+element).append($('<option></option>').val(field.id).html(field.name).attr('data-address_name', field.name));
	            	}
	        	}
	        });
	        $("#"+element).prop("disabled", false);
	    });
    }
    $(document).on('change', '.countrystatecity', function(){
    	var element_id = $(this).attr('element-id');
    	var id = $(this).attr('id');
    	if(element_id == 'country'){
    		var country_id = $(this).val();
    		var state_id = $(this).attr('dependent-state-id');
    		$('#'+$(this).attr('dependent-city-id')).empty().append($('<option value="">Select City</option>'));
    		populateState(state_id, country_id);
    	}   
    	else if(element_id == "state") 	{
    		var state_id = $(this).val();
    		var city_id = $(this).attr('dependent-city-id');
    		populateCity(city_id, state_id);
    	}
    	
    });


        fun =function(c){
        alert(c);
        }

}(jQuery));