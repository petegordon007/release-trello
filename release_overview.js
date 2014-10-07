var tag = "";

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
	}

	function onFailedAuthorization() {
	    $("#connectionstatus").text("Authorisation Failed");
	}
});

function fetchReleaseStories( board, tag ) {
	this.tag = tag;
	var promise = new Promise( function( resolve, reject ) {
		Trello.get("boards/" + board + "/lists", { fields : 'name', cards: 'open', card_fields : 'name,url' }, resolve, reject );
	});

	promise.then( function( result ) {
		findReleaseStories( result, this.tag );
	});
}


function findReleaseStories( lists, needle ) {
	$('#summary').empty();
	$('#output').empty();

	needle = needle ? needle : ""; 
	
	var re = new RegExp( needle.toLowerCase() );
	var rePoints = new RegExp( "\{(.*)\}" );
	var reDoneList = new RegExp( "Done:" );
	var reSprintList = new RegExp( "Sprint" );
	var total = 0;
	var complete = 0;

	$.each( lists, function( ix, list ) {
		$.each( list.cards, function ( ix2, card ) {

			if ( re.test( card.name.toLowerCase() ) ) {

				var status = "amber";
				if ( reDoneList.test( list.name ) ) {
					status = "green";
				} else if ( reSprintList.test( list.name ) ) {
					status = "red";
				}

				writeCard( list.name, card.id, card.name, card.url, status );
           
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
	
	writeSummary( total, complete );
};

function writeSummary( total, complete ) {
	$("<div>")
	.text("Total: " + total + " Complete: " + complete + " Percentage: " + Math.floor( complete/total * 100 ) + '%')
	.appendTo('#summary');
};

function writeCard( listName, cardId, cardName, cardUrl, status ) {
	$("<span>")
	.attr({id: cardId})
    .addClass("card")
    .text( '[' + listName + '] : ' + cardName )
    .appendTo('#output');

	$("<span>")
    .addClass("rag")
    .addClass(status)
    .prependTo('#' + cardId);

    $("<a>")
    .addClass("link")
    .attr({href: cardUrl, target: "trello"})
    .text( 'link' )
    .appendTo('#' + cardId);
};