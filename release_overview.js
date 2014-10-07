$(document).ready(function(){
	Trello.authorize({
	    interactive: true,
	    type: "popup",
	    expiration: "never",
	    name: "surveyrequest",
	    persist: "true",
	    success: function() { onAuthorizeSuccessful(); },
	    error: function() { onFailedAuthorization(); },
	    scope: { read: true, write: true},
	});	

	function onAuthorizeSuccessful() {
	    /* Trello.boards.get("51a7310f77b391ff2300077a",  function( board) {
	    	console.log( board.name );
	    }); */
		$("#connectionstatus").text("Ready");

		findHashtags();
	}

	function onFailedAuthorization() {
	    $("#connectionstatus").text("Authorisation Failed");
	}
});

function findReleaseStories( needle ) {
	$('#summary').empty();
	$('#output').empty();
	
	var re = new RegExp( needle.toLowerCase() );
	var rePoints = new RegExp( "\{(.*)\}" );
	var reDoneList = new RegExp( "Done:" );
	var reSprintList = new RegExp( "Sprint" );
	var total = 0;
	var complete = 0;

	Trello.get("boards/51a7310f77b391ff2300077a/lists", { fields : 'name', cards: 'open', card_fields : 'name,url' }, function(lists) {

		$.each( lists, function( ix, list ) {
			$.each( list.cards, function ( ix2, card ) {

				if ( re.test( card.name.toLowerCase() ) ) {

					$("<span>")
					.attr({id: card.id})
	                .addClass("card")
	                .text( '[' + list.name + '] : ' + card.name )
	                .appendTo('#output');

					var $rag  = $("<span>")
	                .addClass("rag")
	                .prependTo('#' + card.id);

	                if ( reDoneList.test( list.name ) ) {
						$rag.addClass("green");
					} else if ( reSprintList.test( list.name ) ) {
						$rag.addClass("red");
					} else {
						$rag.addClass("amber");
					}

	                $("<a>")
	                .addClass("link")
	                .attr({href: card.url, target: "trello"})
	                .text( 'link' )
	                .appendTo('#' + card.id);
	           
		            var matches = rePoints.exec( card.name );
		            if ( matches && matches.length > 0 ) {
		            	if ( reDoneList.test( list.name ) ) {
		            		complete += parseInt( matches[1] );
		            	}
		            	total += parseInt( matches[1] );
		            }     
	            }
			});
		});

		$("<div>")
		.text("Total: " + total + " Complete: " + complete + " Percentage: " + Math.floor( complete/total * 100 ) + '%')
		.appendTo('#summary');
    });
};