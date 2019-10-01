/* eslint-disable */
$(function() {
	$.ajax('/data/data.json', {
		type: 'GET',
		success: function(data) {
			$('#data').html(JSON.stringify(data));
			
			$('#parsed-data [data-bind]').each(function(i, item) {
				var 
					attrName = $(item).attr('data-bind'),
					dataByAttr = data[attrName];
					
				$(item).html(attrName.toUpperCase() + ': ' + dataByAttr);
			});
			
			console.log('GET', data);
		}
	});
	
	$('#send-data').on('click', function(event) {
		event.preventDefault();
		
		var dataForSend = {
			name: 'Elon',
			surname: 'Musk',
			owner: [
				'Tesla',
				'SpaceX'
			]
		};
		
		$.ajax('/api', {
			data: JSON.stringify(dataForSend),
			type: 'POST',
			
			success: function(responseData) {
				$('#send-data').html('DONE, this data sent:');
				$('#saved-data').html(responseData);
				
				console.log('POST', arguments);
				console.info('Reload page or perform new request to see this changes');
			}
		});
	});
});