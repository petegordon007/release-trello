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
	this.cardList = [];

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

	this.addCardToList = function( listName, cardId, cardName, cardUrl, status ) {
		this.cardList.push( { 
			'listName' : listName,
			'cardId' : cardId,
			'cardName' : cardName,
			'cardUrl' : cardUrl,
			'status' : status
		});
	};

	this.writeCard = function( outputId, listName, cardId, cardName, cardUrl, status ) {
		$("<span>")
		.attr({id: cardId})
	    .addClass("card")
	    .text( '[' + listName + '] : ' + cardName )
	    .appendTo( outputId );

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

	this.writeCards = function( outputId ) {
		var me = this;
		this.cardList.forEach( function( card ) {
			me.writeCard( outputId, card.listName, card.cardId, card.cardName, card.cardUrl, card.status );
		});
	};
};

function BoardSearcher() {

	var summary = new SummaryCollector();

	this.fetchReleaseStories = function ( boards, tag ) {
		this.clearView();
		
		if ( Array.isArray( boards ) ) {
			for( var i = 0; i < boards.length; ++i ) {
				var isLast = !!( i ===  (boards.length - 1) );
				this.doTheWorkOfFetchingAndAdding( boards[i], tag, summary, isLast );
			}
		} else {
			this.doTheWorkOfFetchingAndAdding( boards, tag, summary, true );
		}
	};

	this.doTheWorkOfFetchingAndAdding = function( board, tag, summary, isLast ) {

		var mySummary = summary;
		var me = this;

		var promise = new Promise( function( resolve, reject ) {
			Trello.get("boards/" + board + "/lists", { fields : 'name', cards: 'open', card_fields : 'name,url' }, resolve, reject );
		});

		if ( isLast ) {
			promise.then( function( result ) {
				me.findReleaseStories( result, tag, mySummary, me.writeCard );
				mySummary.writeSummary('#summary');
				mySummary.writeCards('#output');
			});
		} else {
			promise.then( function( result ) {
				me.findReleaseStories( result, tag, mySummary, me.writeCard );
			});
		}	
	};

	this.clearView =  function() {
		$('#summary').empty();
		$('#output').empty();
	};

	this.findReleaseStories = function( lists, needle, summary ) {

		var chooser = new StatusChooser();

		//Used for finding needle
		needle = needle ? needle : ""; 
		var re = new RegExp( needle.toLowerCase() );
		
		$.each( lists, function( ix, list ) {
			$.each( list.cards, function ( ix2, card ) {
				if ( re.test( card.name.toLowerCase() ) ) {
	                summary.addCard( card.name, list.name );
	                summary.addCardToList( list.name, card.id, card.name, card.url, chooser.choose( list.name ) );
	            }
			});
	    });
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