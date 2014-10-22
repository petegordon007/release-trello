var tag = "";
function StatusChooser() {
	var reDoneList = new RegExp( "Done:" );
	var reSprintList = new RegExp( "Sprint" );

	this.choose = function( listName ) {
		var status = "amber";
		if ( reDoneList.test( listName ) ) {
			status = "green";
		} else if ( reSprintList.test( listName ) ) {
			status = "red";
		}
		return status;	
	};
};

function SummaryCollector() {
	var rePoints = new RegExp( "\{(.*)\}" );
	var reDoneList = new RegExp( "Done:" );
	this.total = 0;
	this.complete = 0;

	this.addCard = function( cardName, listName ) {
		var matches = rePoints.exec( cardName );
        if ( matches && matches.length > 0 ) {
        	if ( reDoneList.test( listName ) ) {
        		this.complete += parseInt( matches[1] );
        	}
        	this.total += parseInt( matches[1] );
        }     
	};

	this.writeSummary = function( outputid ) {
		var percentageComplete = Math.floor( this.complete/this.total * 100 );
		$("<div>").text("Total: " + this.total + " Complete: " + this.complete + " Percentage: " + percentageComplete + '%').appendTo( outputid );
	};
};


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
		$("#connectionstatus").text("Ready");
	}

	function onFailedAuthorization() {
	    $("#connectionstatus").text("Authorisation Failed");
	}
});

function fetchReleaseStories( boards, tag ) {
	
	clearView();

	if ( Array.isArray( boards ) ) {
		$.each( boards, function( ix, board ) {
			doTheWorkOfFetchingAndAdding( board, tag );
		});
	} else {
		doTheWorkOfFetchingAndAdding( boards, tag );
	}
}

function doTheWorkOfFetchingAndAdding( board, tag ) {
	this.tag = tag;
	var promise = new Promise( function( resolve, reject ) {
		Trello.get("boards/" + board + "/lists", { fields : 'name', cards: 'open', card_fields : 'name,url' }, resolve, reject );
	});

	promise.then( function( result ) {
		findReleaseStories( result, this.tag );
	});
}

function clearView() {
	$('#summary').empty();
	$('#output').empty();
}

function findReleaseStories( lists, needle ) {

	var chooser = new StatusChooser();
	var summary = new SummaryCollector();

	//Used for finding needle
	needle = needle ? needle : ""; 
	var re = new RegExp( needle.toLowerCase() );
	
	$.each( lists, function( ix, list ) {
		$.each( list.cards, function ( ix2, card ) {
			if ( re.test( card.name.toLowerCase() ) ) {
				writeCard( list.name, card.id, card.name, card.url, chooser.choose( list.name ) );
                summary.addCard( card.name, list.name );
            }
		});
    });
	
	summary.writeSummary( '#summary' );
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

