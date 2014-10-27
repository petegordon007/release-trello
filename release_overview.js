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

function CompletedStatusChooser() {
	this.choose = function( listName ) {
		return "green";	
	};
};

function BacklogStatusChooser() {
	this.choose = function( listName ) {
		return "red";	
	};
};

var BoardList = {
	backlog : { 
		id : '527781efbe989817700147cf',
		chooser : new BacklogStatusChooser()
	},
	currentsprint : {
		id : '51a7310f77b391ff2300077a',
		chooser : new StatusChooser()
	},
	completed : {
		id : '5188fe5bc03a081a51007c26',
		chooser : new CompletedStatusChooser()
	}
};


function SummaryCollector() {
	var rePoints = new RegExp( "\{(.*)\}" );
	var reDoneList = new RegExp( "Done:" );
	this.total = 0;
	this.complete = 0;
	this.cardList = [];

	this.countCardPoints = function( cardName, status ) {
		var matches = rePoints.exec( cardName );
        if ( matches && matches.length > 0 ) {
        	if ( status == "green" ) {
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

		this.countCardPoints( cardName, status );
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
		this.cardList.sort( function(a,b) {
			if ( a.status === "red" ) {
				return -1;
			}

			if ( a.status === "amber" && b.status === "green" ) {
				return -1;
			}

			return 1;
		});

		this.cardList.forEach( function( card ) {
			me.writeCard( outputId, card.listName, card.cardId, card.cardName, card.cardUrl, card.status );
		});
	};

	this.drawPieChart = function( outputId ) {

		var data = [['Todo', this.total - this.complete],['Done', this.complete]];

		var plot1 = jQuery.jqplot ( outputId, [data], 
		{ 
		  seriesColors: [ "#FF0000", "#00FF00" ],
		  seriesDefaults: {
		    // Make this a pie chart.
		    renderer: jQuery.jqplot.PieRenderer, 
		    rendererOptions: {
		      // Put data labels on the pie slices.
		      // By default, labels show the percentage of the slice.
		      showDataLabels: true
		    }
		  }, 
		  legend: { show:true, location: 'e' }
		});
	};
};

function BoardSearcher() {

	this.summary = new SummaryCollector();

	this.setSummary = function( summary ) {
		this.summary = summary;
	};

	this.searchCurrentSprint = function( tag ) { 
		this.clearView();
		this.fetchReleaseStories( BoardList.currentsprint, tag );
	};

	this.searchAllSprints = function( tag ) {
		this.clearView();
		this.fetchReleaseStories( [BoardList.backlog, BoardList.currentsprint, BoardList.completed], tag );
	};

	this.fetchReleaseStories = function ( boards, tag ) {
		if ( Array.isArray( boards ) ) {
			for( var i = 0; i < boards.length; ++i ) {
				var isLast = !!( i ===  (boards.length - 1) );
				this.doTheWorkOfFetchingAndAdding( boards[i], tag, this.summary, isLast );
			}
		} else {
			this.doTheWorkOfFetchingAndAdding( boards, tag, this.summary, true );
		}
	};

	this.doTheWorkOfFetchingAndAdding = function( board, tag, summary, isLast ) {

		var mySummary = summary;
		var me = this;

		var promise = new Promise( function( resolve, reject ) {
			Trello.get("boards/" + board.id + "/lists", { fields : 'name', cards: 'open', card_fields : 'name,url' }, resolve, reject );
		});

		if ( isLast ) {
			promise.then( function( result ) {
				me.findReleaseStories( result, tag, mySummary, board.chooser );
				mySummary.writeSummary('#summary');
				mySummary.drawPieChart('chartdiv');
				mySummary.writeCards('#output');
			});
		} else {
			promise.then( function( result ) {
				me.findReleaseStories( result, tag, mySummary, board.chooser );
			});
		}	
	};

	this.clearView =  function() {
		$('#summary').empty();
		$('#output').empty();
	};

	this.findReleaseStories = function( lists, needle, summary, chooser ) {
		//Used for finding needle
		needle = needle ? needle : ""; 
		var re = new RegExp( needle.toLowerCase() );
		
		$.each( lists, function( ix, list ) {
			$.each( list.cards, function ( ix2, card ) {
				if ( re.test( card.name.toLowerCase() ) ) {
	                summary.addCardToList( list.name, card.id, card.name, card.url, chooser.choose( list.name ) );
	            }
			});
	    });
	};
};

function TagFinder() {

	this.findTagsOnBoard = function() {
		var searcher = new BoardSearcher();
		searcher.setSummary( new TagSummary() );
	
		searcher.fetchReleaseStories( [BoardList.backlog, BoardList.currentsprint, BoardList.completed], '' );
	};
};

function TagSummary() {
	var reTag = /#[\w-]+/g;
	this.tags = {};

	this.writeSummary = function() {};
	this.drawPieChart = function() {};
	this.writeCards = function() {};

	this.addCardToList = function( listName, cardId, cardName, cardUrl, status ) {

		var matches = cardName.match( reTag );
		var myTags = this.tags;
  
        if ( matches && matches.length > 0 ) {
        	$.each( matches, function( idx, match ) {
        		var tag = match.substring(1).toLowerCase();

        		if ( myTags.hasOwnProperty( tag ) ) { 
        			return true;
        		}

				$('#taglist').append( $('<option></option>').val( match ).html( tag ) );
				myTags[tag] = "Found";
			});
        }
    }
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

		$('#taglist').append( $('<option></option>').val( '' ).html( 'All' ) );

		var tagFinder = new TagFinder();
		tagFinder.findTagsOnBoard();
	}

	function onFailedAuthorization() {
	    $("#connectionstatus").text("Authorisation Failed");
	}
});