if (typeof wsYii2 == 'undefined') {
	var wsYii2 = {};
}

wsYii2.FormHelper = {

	/**
	 * Load ActiveForm with new model attributes via Javascript
	 *
	 * Form fields must have been named like this: <input name="Contact[firstname]"> <input name="Contact[lastname]">
	 *
	 * @param {(string|jQuery object)} formSelector - String with selector or a jQuery object
	 * @param {object} models : Object where keys match the 1st level form field names and the values are the model attributes that match the 2nd level, eg.: {Contact: {firstname: 'John', lastname: 'Doe'}, }
	 */
	loadActiveForm: function(formSelector, models) {
		if (!(formSelector instanceof jQuery)) {
			formSelector = $(formSelector);
		}

		$.each(models, function(modelName, model) {
			// Skip properties that are not models (= iterable arrays/objects)
			if (typeof model === 'string') return true;

			$.each(model, function(attributeName, attributeValue) {
				$input = formSelector.find(':input[name="'+ modelName +'['+ attributeName +']"]');
				if ($input.length > 1) {
					if ($input.first().is(':radio')) {
						$input.each(function() {
							if ($(this).val() == attributeValue) {
								$(this).prop('checked', true).click();
								if ($(this).closest('.btn').length > 0) {
									$(this).closest('.btn').button('toggle');
								}
							}
						});
					} else {
						alert('In wsYii2.FormHelper.loadActiveForm an input had multiple tags but they are not radio buttons.');
					}
				} else {
					if (attributeValue && $input.is('select')) {
						if ($input.find('option[value="'+ (attributeValue.replace /*only for strings*/ ? attributeValue.replace(/"/g, '&quot;') : attributeValue) +'"]').length == 0) {
							// automatically add an option with the current value so that it is not lost when saving the form back into the model
							var attributeLabel = 'Current value: '+ attributeValue;
							if (model._meta && model._meta.labels && model._meta.labels[attributeName]) {
								attributeLabel = model._meta.labels[attributeName];
							}
							$input.prepend(  $('<option/>').attr('value', attributeValue).html(attributeLabel)  );
						}
					}
					$input.val(attributeValue);
				}
			})
		});
	},

	/**
	 * Convert an HTML form to an object, specified by a selector 
	 *
	 * @param {string|jQuery object} : formSelector
	 * @param {boolean} : set to true to only collected fields that have been changed
	 */
	formToObject: function(formSelector, onlyChanged) {
		var data = $(formSelector).serializeArray().reduce(function(m,o){ m[o.name] = o.value; return m;}, {});

		// Add Select2 widgets where nothing is selected - serializeArray() will no include those!
		$(formSelector).find('select.select2-hidden-accessible').each(function(s2indv, s2val) {
			if ($(this).select2('data').length == 0) {
				data[ $(this).attr('name') ] = '';
			}
		});

		if (onlyChanged) {
alert('This part of the method (only returning changed values) has not been implemented yet. Returning all values for now.');
return data;
			$.each(data, function(indx, val) {
				var defaultVal;
				var $input = $(formSelector).find(':input[name="'+ indx +'"]');
/*
TODO:
- consider the different types below this point  (basis: https://stackoverflow.com/questions/4591889/get-default-value-of-an-input-using-jquery#4592082)
	input: https://www.w3schools.com/jsref/prop_text_defaultvalue.asp
	checkbox and radio: https://www.w3schools.com/jsref/prop_checkbox_defaultchecked.asp
	select: https://www.w3schools.com/jsref/prop_option_defaultselected.asp
- also make function that will reset the default values to the current values on the form, again considering all 3 types
*/
				if ($input.length > 1) {
					if ($input.first().is(':radio')) {
						$input.each(function() {
							if ($(this).prop('defaultChecked')) {
								defaultVal = $(this).val();
							}
						});
					} else {
						alert('In wsYii2.FormHelper.loadActiveForm an input had multiple tags but they are not radio buttons.');
					}
				} else {
					$input.val(attributeValue);
				}
			});
		} else {
			// Source: comment from juanpastas on https://stackoverflow.com/a/17784656/2404541
			return data;
		}
	},

	/**
	 * Object for highlighting errors on a form using Bootstrap tabs
	 */
	HighlightTabbedFormErrors: {

		init: function(formSelector) {
			var myself = this;

			$(formSelector).on('afterValidate', function(ev) {
				myself.checkForErrors(formSelector);
			});

			// Also check on initial page load in case it has been validated server-side and came back with errors
			myself.checkForErrors(formSelector);
		},

		checkForErrors: function(formSelector) {
			if (typeof formSelector == 'undefined') {
				formSelector = 'body';
			}

			// If form has client-side errors make sure the first tab with an error is active and user is aware there are problems
			var $form = $(formSelector);
			var $errors = $form.find('.has-error');
			if ($errors.length > 0) {
				var $tabPane = $errors.first().closest('.tab-pane');
				if ($tabPane.length > 0) {
					var paneId = $tabPane.attr('id');
					$form.find('.nav-tabs a[href="#'+ paneId +'"]').tab('show');
				}
				$form.find('input[type=submit], button[type=submit]').tooltip({trigger: 'manual', title: 'Please check the form.', container: 'body'});  //use container=body to make it not wrap inside element with little space
				$form.find('input[type=submit], button[type=submit]').tooltip('show');

				var origBgColor = $('.tooltip-inner, .tooltip-arrow').css('background-color');
				$('.tooltip-inner').css('background-color', '#ec0000');  //show it in red
				$('.tooltip-arrow').css('border-top-color', '#ec0000');

				setTimeout(function() {
					$('input[type=submit], button[type=submit]').tooltip('destroy');
					$('.tooltip-inner').css('background-color', origBgColor);
					$('.tooltip-arrow').css('border-top-color', origBgColor);
				}, 2000);
			}
		}
	},

	/**
	 * Object for warning about leaving a form without changes having been saved
	 */
	WarnLeavingUnsaved: {

		savedState: null,
		currState: null,

		init: function(formSelector) {
			this.savedState = this.getFormData(formSelector);

			var myself = this;

			$(window).on('beforeunload', function(event) {
				myself.currState = myself.getFormData(formSelector);

				if (myself.currState !== myself.savedState) {
					return 'You have unsaved changes. They will be lost if you leave the page.';
				}
			});
		},

		markSaved: function(formSelector) {
			this.savedState = this.getFormData(formSelector);
		},

		getFormData: function(formSelector) {
			// Use this instead in case we need to do something more fancy
			// var formData = $(formSelector).serializeArray();
			// return $.param(formData);

			return $(formSelector).serialize();
		}
	}
};
