<?php

require( 'imagecombiner.php' );

$image1 = '.\images\dev-' . $_REQUEST['progress'] .'.png';
$image2 = '.\images\progress-' . $_REQUEST['value'] . '.png';

// print( $image1 );
// print( "\n" );
// print( $image2 );
// exit();

$oCombiner = new clsImageCombiner();
$imgCombined = $oCombiner->combineImages( $image1, $image2 );

header( "Content-type: image/png" );
imagepng( $imgCombined );