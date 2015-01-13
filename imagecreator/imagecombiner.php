<?php
class clsImageCombiner {

	private $w1 = 30;
	private $w2 = 30;

	private $h1 = 30;
	private $h2 = 30;

	public function combineImages( $srcPath1, $srcPath2 ) {

		$srcImage1 = imagecreatefrompng ( $srcPath1 );
		$srcImage2 = imagecreatefrompng ( $srcPath2 );

		$resizedImage1 = imagecreatetruecolor($this->w1, $this->h1);
		$resizedImage2 = imagecreatetruecolor($this->w2, $this->h2);

		imagecopyresized ( $resizedImage1 , $srcImage1 , 0 , 0 , 0 , 0 , $this->w1 , $this->h1 , imagesx( $srcImage1 ) , imagesy( $srcImage1 )  );
		imagecopyresized ( $resizedImage2 , $srcImage2 , 0 , 0 , 0 , 0 , $this->w2 , $this->h2 , imagesx( $srcImage2 ) , imagesy( $srcImage2 ) );

		$newHeight = max( $this->h1, $this->h2 );
		$newWidth = $this->w1 + $this->w2;

		$combinedImage = imagecreatetruecolor($newWidth, $newHeight);

		imagecopyresampled($combinedImage, $resizedImage1, 0, 0, 0, 0, $this->w1, $this->h1, $this->w1, $this->h1);
		imagecopyresampled($combinedImage, $resizedImage2, $this->w1, 0, 0, 0, $this->w2, $this->h2, $this->w2, $this->h2);

		return $combinedImage;
	}

}