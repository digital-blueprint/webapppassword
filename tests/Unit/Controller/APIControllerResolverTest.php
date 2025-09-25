<?php

// SPDX-FileCopyrightText: Aleix Quintana Alsius <kinta@communia.org>
// SPDX-License-Identifier: AGPL-3.0-or-later
namespace OCA\Files_Sharing\Tests\Controller;

use OC\Core\Controller\PreviewController as CorePreviewController;
use OCA\Files_Sharing\Controller\ShareAPIController as FilesSharingShareAPIController;
use OCA\WebAppPassword\Controller\PreviewController;
use OCA\WebAppPassword\Controller\ShareAPIController;

use Test\TestCase;

/**
 * Class APIControllerResolverTest
 *
 * This test will check for issues when subclassing some core controllers.
 */
class APIControllerResolverTest extends TestCase {
	/**
	 * Data provider with each parent and extended subclass name
	 */
	public function extendedClasses() {
		$data = [];
		$parent_class = ShareAPIController::class;
		$subclass = FilesSharingShareAPIController::class;

		$data[] = [ $parent_class, $subclass ];

		$parent_class = CorePreviewController::class;
		$subclass = PreviewController::class;

		$data[] = [ $parent_class, $subclass ];

		return $data;
	}
	/**
	 * @dataProvider extendedClasses
	 */
	public function testSubclassConstructorArgumentsMatch(string $parent_class, string $subclass) {
		$reflection_class = new \ReflectionClass($subclass);
		$sub_class_constructor = $reflection_class->getConstructor();

		$parent_class = new \ReflectionClass($parent_class);
		$parent_class_constructor = $parent_class->getConstructor();

		$sub_class_args = array_map(function ($param) {
			return $param->getName() .":". $param->getType() ;
		}, $sub_class_constructor->getParameters());

		$parent_classArgs = array_map(function ($param) {
			return $param->getName() .":". $param->getType();
		}, $parent_class_constructor->getParameters());

		$this->assertEquals($parent_classArgs, $sub_class_args);
	}
}
