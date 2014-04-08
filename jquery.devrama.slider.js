/**
 * DrSlider Version 0.9.4
 * Developed by devrama.com
 * 
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 * 
 */

(function($){
	var DrSlider = function(element, options){
		this.width = undefined,
		this.height = undefined,
		this.parent_width = undefined,
		this.num_slides = 0;
		this.current_slide = undefined;
		this.$sliders = undefined;
		this.$very_current_slide = undefined; //This is very close current slide, it is the one before transitioning, and the moment when user click 'next', 'prev' or 'navigations'.
		this.is_pause = false;
		this.play_timer = true;
		this.active_timer = false;
		this.on_transition = false;
		this._$progress_bar = undefined;
		this.all_transitions = ['slide-left', 'slide-right', 'slide-top', 'slide-bottom', 'fade', 'split', 'split3d', 'door', 'wave-left', 'wave-right', 'wave-top', 'wave-bottom'];
		
		this.requestFrame = window.requestAnimationFrame || 
							window.webkitRequestAnimationFrame || 
							window.mozRequestAnimationFrame || 
							window.oRequestAnimationFrame || 
							window.msRequestAnimationFrame ||
							function (callback) {
								return window.setTimeout(callback, 1000 / 60);
							};
		

		this.options = {
			width: undefined, //initial width, automaticall ycalculated once the first image is loaded
			height: undefined, //initial height, automatically calculated once the first image is loaded
			userCSS: false, //if this is true, 'Previous, Next Buttons and Navigation CSS' will not be applied. User should define CSS in their css file.
			transitionSpeed: 1000,
			duration: 4000,
			showNavigation: true,
			classNavigation: undefined,
			navigationColor: '#9F1F22',
			navigationHoverColor: '#D52B2F',
			navigationHighlightColor: '#DFDFDF',
			navigationNumberColor: '#000000',
			positionNavigation: 'out-center-bottom',
						// 'out-center-bottom', 'out-left-bottom', 'out-right-bottom', 'out-center-top', 'out-left-top', 'out-right-top',
						// 'in-center-bottom', 'in-left-bottom', 'in-right-bottom', 'in-center-top', 'in-left-top', 'in-right-top',
						// 'in-left-middle', 'in-right-middle'
			navigationType: 'number', // number, circle, square
			showControl: true,
			classButtonNext: undefined,
			classButtonPrevious: undefined,
			controlColor: '#FFFFFF',
			controlBackgroundColor: '#000000',
			positionControl: 'left-right', // 'left-right', 'top-center', 'bottom-center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
			transition: 'slide-left', //random, slide-left, slide-right, slide-top, slide-bottom, fade, split, split3d, door, wave-left, wave-right, wave-top, wave-bottom
			showProgress: true,
			progressColor: '#797979',
			pauseOnHover: true,
			onReady: undefined
			
			
		};
		
		
		var css = '\
					<style id="devrama-css" type="text/css">\
					.devrama-slider,\
					.devrama-slider *,\
					.devrama-slider *::before,\
					.devrama-slider *::after{\
					 -webkit-box-sizing: border-box;\
					    -moz-box-sizing: border-box;\
					         box-sizing: border-box;\
					}\
					</style>\
					';
		
		if($('#devrama-css').length == 0){
			if($('html>head').length > 0) $('html>head').append(css);
			else $('body').append(css);
		}
		
		$.extend(this.options, options);
		
		this.$ele = $(element);
		this.$ele.wrapInner('<div class="inner devrama-slider"><div class="projector"></div></div>');
		this.$ele_in = this.$ele.children('.inner:first'); 
		this.$ele_projector = this.$ele_in.children('.projector:first');
	};
	
	DrSlider.prototype = {
		_init: function(){
			var that = this;
			
			
			this._stopTimer(function(){
				that._prepare(function(){
					if(typeof that.options.onReady == 'function') that.options.onReady(); 
					that._playSlide();
					$(window).on('resize.DrSlider', function(){
						that._resize();
					});
				});
			});
			
			if(this.options.pauseOnHover){
				this.$ele_in.on('mouseenter', function(){ 
					that.is_pause = true;
					that._showButtons();
				});
				this.$ele_in.on('mouseleave', function(){ 
					that.is_pause = false;
					that._hideButtons();
				});
			}
			
		},
		
		_getEndEvent: function(prop){
			var vendors = 'webkit Moz Ms o Khtml'.split(' ');
			var len = vendors.length;
			 
			if (prop in document.body.style) return prop+'end';
			
			prop = prop.charAt(0).toUpperCase() + prop.slice(1);
			for(var i =0; i<vendors.length; i++){
				if(vendors[i]+prop in document.body.style) return vendors[i]+prop+'End';
			}
			
			return false;
		},
		
		_animate: function(selector, from, to, duration, delay, callback, jQueryAnimation){
			var $obj;
			
			if(!delay) delay = 0;
			
			if(selector instanceof jQuery) $obj = selector;
			else $obj = $(selector);
			
			if($obj.length == 0){
				if(typeof callback == 'function') {
					setTimeout(function(){
						callback();
					}, delay);
					
				}
				return;
			}
			
			
			if(typeof duration != 'number') duration = 0;
			if(typeof delay != 'number') delay = 0;
			
			var event_end;
			if(jQueryAnimation) event_end = false;
			else event_end = this._getEndEvent('transition');
			
			if(event_end !== false){
				var from_delay = 0;
				if(from) {
					$obj.css(from);
					from_delay = 30;
				}
				
				setTimeout(function(){
					var transition = {
						'-webkit-transition': 'all '+duration+'ms ease '+delay+'ms',
						'-moz-transition': 'all '+duration+'ms ease '+delay+'ms',
						'-o-transition': 'all '+duration+'ms ease '+delay+'ms',
						'transition': 'all '+duration+'ms ease '+delay+'ms'
					}
					var css = $.extend({}, transition, to);
					
					$obj.css(css);
					
					var fired = false; //to ensure it fires event only once
					$obj.one(event_end, function(){
						
						$obj.css({
							'-webkit-transition': '',
							'-moz-transition': '',
							'-o-transition': '',
							'transition': ''
						});
						if(typeof callback == 'function') callback();
						
					});
				
				
				}, from_delay);
			}
			else {
				setTimeout(function(){
					if(from) $obj.css(from);
					$obj.animate(to, duration, function(){
						callback();
					});
				}, delay);
			}
			
			
			
		},
				
		_prepare: function(callback){
			var that = this;
			
			this.parent_width = this.$ele.parent().width();
			
			if(this.$ele.css('position') == 'static') this.$ele.css('position', 'relative');
			
			this.$ele.css({
				'visibility': 'hidden',
				'width': 'auto',
				'height': 'auto'
			});
			
			this.$ele_in.css({
				'position': 'relative',
				'margin': '0 auto'
			});
			this.$ele_projector.css({
				'position': 'relative',
				'overflow': 'hidden'
			});
			
			/*
			 * set CSS for init
			 * Only the first child will be shown at start, hiding others.
			 */
			var $sliders = this.$ele_projector.children('[class!=slider-progress]');
			$sliders.css({
				'display': 'none',
				'position': 'absolute',
				'top': '0',
				'left': '0'
			});
			this.$sliders = $sliders;
			this.num_slides = this.$sliders.length;
			
			//preload images sequentially so that images are not loaded slide by slide.
			var arr_all_images = [];
			this.$ele_projector.find('[data-lazy-src], [data-lazy-background]').each(function(){
				var image = $(this).data('lazy-src') || $(this).data('lazy-background');
				arr_all_images.push(image);
			});
			this._preloadImages(arr_all_images, function(){ });
			
			/*
			 * There are 3 possibilities.
			 * 1[image]
			 *    <img data-lazy-src data-transition/>
			 * 2[link]
			 *    <a data-lazy-src data-transition><img/></a>
			 * 3[animation]
			 *    <div data-transition data-background>
			 * 		<img data-lazy-src data-start-pos data-end-pos data-duration data-easing />
			 * 		<img data-lazy-src data-start-pos data-end-pos data-duration data-easing />
			 *    </div>
			 *    
			 * Now, we gotta decide what the case is.
			 */
			
			this.$sliders.each(function(){
				var transparent_data = 'data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
				
				if(!$(this).hasClass('slider-progress') && !$(this).hasClass('button-slider')){
					
					var images = [];
					var has_main_image = true;
					if($(this).data('lazy-background')){
						$(this).addClass('primary-img background');
						images.push($(this).data('lazy-background'));
					}
					else if($(this).data('lazy-src')) {
						$(this).addClass('primary-img image');
						$(this).css('vertical-align', 'bottom'); //to fix extra space problem inside a link.
						$(this).attr('src', transparent_data);
						images.push($(this).data('lazy-src'));
					}
					//such as <a><img></a> <div><img></div>, push a image below, so we do not push it into array
					else if($(this).children().length == 1 && $(this).children('img').length == 1){
						$(this).children('img[data-lazy-src]:first').addClass('primary-img image');
					}
					else {
						has_main_image = false;
					}
					
					$(this).find('[data-lazy-src]').each(function(){
						$(this).css('vertical-align', 'bottom'); //to fix extra space problem inside a link.
						$(this).attr('src', transparent_data);
						images.push($(this).data('lazy-src'));
					});
					
					$(this).find('[data-lazy-background]').each(function(){
						images.push($(this).data('lazy-background'));
					});
					
					$(this).data({'has-main-image': has_main_image,'images': images});
					
					$(this).children('[data-pos]').css('display', 'none');
				}
				
			});
			
			
			
			//if initial width and height are defined, this sets the box width and height before loading images.
			if(this.options.width && this.options.height){
				var obj = {
							width: this.options.width,
							height: this.options.height
							};
				this.width = obj.width;
				this.height = obj.height;
				this.$ele_in.css(obj);
				this.$ele_projector.css(obj);
				
				//show Controls
				if(that.num_slides > 1 && that.options.showControl) that._attachControl();
				//show Navigation
				if(that.num_slides > 1 && that.options.showNavigation) that._attachNavigation();
				
				if(that.options.classNavigation) that._attachUserNavigation();
				if(that.options.classButtonPrevious || that.options.classButtonNext) that._attachUserControlEvent();
				
				
				callback();
			}
			else {
				/*
				 * load first image and set the box dimension as the image size
				 */
				var first_img = new Image();
				first_img.onload = first_img.onerror = function(){
					var obj = {
							width: first_img.width,
							height: first_img.height
							};
					
					that.width = obj.width;
					that.height = obj.height;
					that.$ele_in.css(obj);
					that.$ele_projector.css(obj);
					//show Controls
					if(that.num_slides > 1 && that.options.showControl) that._attachControl();
					//show Navigation
					if(that.num_slides > 1 && that.options.showNavigation) that._attachNavigation();
					
					if(that.options.classNavigation) that._attachUserNavigation();
					if(that.options.classButtonPrevious || that.options.classButtonNext) that._attachUserControlEvent();
					
					
					callback();
				}
				
				first_img.src = this.$sliders.first().data('images')[0];
			}
			
			
		},
		
		_resetSize: function($element, new_width, new_height, callback){
			var new_size = {
								width: new_width,
								height: new_height
							};
			var $target1, $target2;
			if($element) {
				$target1 = $element;
				$target2 = $element.find('.primary-img:first');
				$prev_target1 = this.$ele_projector.children('.active.primary-img:first');
				$prev_target2 = this.$ele_projector.children('.active').find('.primary-img:first');
			}
			else {
				$target1 = this.$ele_projector.children('.active');
				$target2 = this.$ele_projector.children('.active').find('.primary-img:first');
			}
			
			$target1.css(new_size);
			$target2.css(new_size);
			
			
			if($element){
				/*
				 * When the size of next slide is different from the current one,
				 * We animate the box size.
				 */
				if(this.width != new_width || this.height != new_height){
					
					$prev_target1.animate(new_size);
					$prev_target2.animate(new_size);
					
					this.$ele_in.css(new_size); //.animate() makes this block 'overflow: hidden', so I use just .css().
					this.$ele_projector.animate(new_size, function(){
						if(typeof callback == 'function') callback();
					});
				}
				else {
					if(typeof callback == 'function') callback();
				}
				
			}
			//This is the case when the window size is resized by the user.
			else {
				if(this.on_transition == true){
					this.$very_current_slide.css({
						'display': 'block',
						'top': '0',
						'left': '0',
						'z-index': '5',
						'width': new_width,
						'height': new_height
					});
				}
				
				this.$ele_in.css(new_size);
				this.$ele_projector.css(new_size);
				
				
				if(typeof callback == 'function') callback();
			}
			
			this.width = new_width;
			this.height = new_height;
			
			
			
			
		},
		
		_resize: function($element, callback){
			var that = this;
			
			this.parent_width = this.$ele.parent().width();
			
			var new_width, new_height, original;
			
			if(this.options.width && this.options.height){
				original = {
					'width': this.options.width,
					'height': this.options.height
				};
			}
			else if(!$element) original = this.$ele_projector.children('.active').data('original');
			else original = $element.data('original');
			
			
			if(original.width > that.parent_width){
				new_width = that.parent_width;
				new_height = new_width*original.height/original.width;
			}
			else{
				new_width = original.width;
				new_height = original.height;
			}
			
			this._resetSize($element, new_width, new_height, callback);
			
			
		},
		
		_attachUserControlEvent: function(){
			var that = this;
			
			if(this.options.classButtonPrevious){
				$('.'+this.options.classButtonPrevious).on('click', function(e){
					e && e.preventDefault();
					if(that.play_timer == false || that.on_transition == true) return;
					
					that._stopTimer(function(){
						that._startTimer(function(){
							that._prev(); 
						});
					});
					
				});
			}
			
			if(this.options.classButtonNext){
				
				$('.'+this.options.classButtonNext).on('click', function(e){
					e && e.preventDefault();
					if(that.play_timer == false || that.on_transition == true) return;
					
					that._stopTimer(function(){
						that._startTimer(function(){ 
							that._next(); 
						});
					});
					
				});
			}
		},
		
		_attachUserNavigation: function(){
			var that = this;
			var $userNavigation = $('.'+this.options.classNavigation).find('[data-index]');
			
			if($userNavigation.length ==  0){
				$userNavigation = $('.'+this.options.classNavigation).children();
			}
			
			
			$userNavigation.on('click', function(e){
				e && e.preventDefault();
				if(that.play_timer == false || that.on_transition == true) return;
				
				$userNavigation.removeClass('active');
				$(this).addClass('active');
				
				var navigation_num;
				
				if($(this).data('index') && $(this).data('index') != ''){
					var slide_num = that.$ele_projector.children('[data-index=\''+$(this).data('index')+'\']').index();
					if(slide_num > 0) navigation_num = slide_num;
					else navigation_num = $(this).data('index');
				}
				else {
					navigation_num = $(this).index();
				}
					
				if(navigation_num == that.current_slide) return;
				
				if(that.play_timer == false || that.on_transition == true) return;
				that._stopTimer(function(){
					if(navigation_num > 0) that.current_slide = navigation_num - 1;
					else that.current_slide = that.num_slides - 1;
					that._startTimer(function(){
						that._next(); 
					});
				});
				
			});
			
		},
		
		
		
		_updateNavigation: function(){
			var that = this;
			if(this.options.classNavigation) {
				$('.'+this.options.classNavigation).find('.active').removeClass('active');
				var user_index = this.$sliders.eq(this.current_slide).data('index');
				
				if(typeof user_index != 'undefined' && user_index != ''){
					$('.'+this.options.classNavigation).find('[data-index=\''+user_index+'\']').addClass('active');
				}
				else {
					var nav_index = $('.'+this.options.classNavigation).children().eq(this.current_slide).data('index');
					if(!nav_index || nav_index == '')
						$('.'+this.options.classNavigation).children().eq(this.current_slide).addClass('active');
				}
			}
			this.$ele_projector.next('.navigation').find('.nav-link').removeClass('active');
			this.$ele_projector.next('.navigation').find('.nav-link.index'+this.current_slide).addClass('active');
			if(!this.options.userCSS){
				this.$ele_projector.next('.navigation').find('.nav-link').css({
					'background-color': this.options.navigationColor
				});
				this.$ele_projector.next('.navigation').find('.nav-link.index'+this.current_slide).css({
					'background-color': this.options.navigationHighlightColor
				});
			}
		},
		
		
		_attachNavigation: function(){
			if(this.num_slides < 2) return;
			
			var that = this;
			var navigation_html = '';
			
			for(var i =0; i < this.num_slides; i++)
				navigation_html += '<span class="nav-link index'+i+'" data-num="'+i+'">'+(i+1)+'</span>';
					
			this.$ele_projector.after('<div class="navigation devrama-slider"><div class="inner">'+navigation_html+'</div></div>');
			
			var pos_nav = this.options.positionNavigation;
			var $navigation = this.$ele_projector.next('.navigation');
			var $nav_link = $navigation.find('.nav-link');
			$navigation.css({
				'font-size': '12px',
				'z-index': '3',
				'user-select': 'none'
			});
					
			if(!this.options.userCSS){
				
				$nav_link.css({
					'display': 'inline-block',
					'width' :  this.options.navigationType != 'number' ? '13px': '',
					'height' :  this.options.navigationType != 'number' ? '13px': '',
					'padding': '0.2em',
					'font-size': '12px',
					'vertical-align': 'bottom',
					'cursor': 'pointer',
					'color': this.options.navigationNumberColor,
					'text-align': 'center',
					'text-indent': this.options.navigationType != 'number' ? '-10000em' : '',
					'width': this.options.navigationType == 'number' ? $nav_link.innerHeight()+'px' : '13px',
					'border': '0px solid transparent',
					'border-radius': this.options.navigationType == 'circle' ? '50%' : '',
					'margin-top': (pos_nav == 'in-left-middle' || pos_nav == 'in-right-middle') ? '5px':'',
					'margin-left': (pos_nav != 'in-left-middle' && pos_nav != 'in-right-middle') ? '5px':''
							
				});
				
				
				
				$navigation.find('.nav-link:first').css({
					'margin-top': '0',
					'margin-left': '0'
				});
				
				$navigation.find('.nav-link:last').css({
					'margin-bottom': '0',
					'margin-right': '0'
				});
				
				if(this.options.positionNavigation == 'in-left-middle'
					|| this.options.positionNavigation == 'in-right-middle'){
					
					$navigation.children('.inner').css({
						'width': $nav_link.outerWidth(true)+'px'
					});
				}
				else {
					var inner_width = 0;
					$nav_link.each(function(){
						inner_width += $(this).outerWidth(true);
					});
					
					$navigation.children('.inner').css({
						'width': inner_width+'px'
					});
				}
				
				
				
				// 'out-center-bottom', 'out-left-bottom', 'out-right-bottom', 'out-center-top', 'out-left-top', 'out-right-top',
				// 'in-center-bottom', 'in-left-bottom', 'in-right-bottom', 'in-center-top', 'in-left-top', 'in-right-top',
				// 'in-left-middle', 'in-right-middle'
				
				var nav_css_additional = {};
				var nav_height = $navigation.outerHeight();
				
				//vertical position
				switch(this.options.positionNavigation){
					case 'out-center-top':
					case 'out-left-top':
					case 'out-right-top':
						$navigation.css('margin', '5px 0');
						this.$ele.css('padding-top', (nav_height+10)+'px'); // 10 is 5+5 margin
						nav_css_additional['top'] = (-1*(nav_height+10))+'px'; // 10 is 5+5 margin
						break;
					case 'out-center-bottom':
					case 'out-left-bottom':
					case 'out-right-bottom':
						nav_css_additional['top'] = '100%';
						$navigation.css('margin', '5px 0');
						this.$ele.css('padding-bottom', (nav_height+10)+'px'); // 10 is 5+5 margin
						break;
					case 'in-center-top':
					case 'in-left-top':
					case 'in-right-top':
						nav_css_additional['top'] = '20px';
						break;
					case 'in-center-bottom':
					case 'in-left-bottom':
					case 'in-right-bottom':
					case 'out-right-bottom':
						nav_css_additional['bottom'] = '20px';
						break;
					case 'in-left-middle':
					case 'in-right-middle':
						nav_css_additional['top'] = '50%';
						nav_css_additional['margin-top'] = (-1*nav_height/2)+'px';
						break;
					
				}
				
				//horizontal position
				switch(this.options.positionNavigation){
					case 'out-left-top':
					case 'out-left-bottom':
					case 'in-left-top':
					case 'in-left-bottom':
					case 'in-left-middle':
						nav_css_additional['left'] = '20px';
						break;
					case 'out-center-top':
					case 'out-center-bottom':
					case 'in-center-top':
					case 'in-center-bottom':
						nav_css_additional['left'] = '50%';
						if(inner_width) nav_css_additional['margin-left'] = (-1*inner_width/2)+'px';
						break;
					case 'out-right-top':
					case 'out-right-bottom':
					case 'in-right-top':
					case 'in-right-bottom':
					case 'in-right-middle':
						nav_css_additional['right'] = '20px';
						break;
				}
				
				
				
				
				var nav_css = {
					'position': 'absolute',
					'z-index': '3'
				};
				
				$.extend(nav_css, nav_css_additional);
				
				$navigation.css(nav_css);
				
				$nav_link.css({
					'background-color': that.options.navigationColor
				});
				$navigation.find('.nav-link:first').css({
					'background-color': that.options.navigationHighlightColor
				});
				
				
				$nav_link.hover(function(){
					$(this).css({
						'background-color': that.options.navigationHoverColor
					});
				},function(){
					$(this).css({
						'background-color': $(this).data('num') == that.current_slide ? that.options.navigationHighlightColor : that.options.navigationColor
					});
				});
				
				
				
				
			}
			
			
			$nav_link.on('click', function(e){
				e && e.preventDefault();
				var navigation = this;
				var navigation_num = $(navigation).data('num');
				
				if(navigation_num == that.current_slide) return;
				
				if(that.play_timer == false || that.on_transition == true) return;
				that._stopTimer(function(){
					if(navigation_num > 0) that.current_slide = navigation_num - 1;
					else that.current_slide = that.num_slides - 1;
					that._startTimer(function(){
						that._next(); 
					});
				});
				
			});
		},
		
		_attachControl: function(){
			var that = this;
			
			this.$ele_in.append('<div class="button-previous button-slider">&lsaquo;</div>');
			this.$ele_in.append('<div class="button-next button-slider">&rsaquo;</div>');
			this.$ele_in.children('.button-slider').css({
				'display': 'none',
				'z-index': '10',
				'user-select': 'none'
			});
			
			if(!this.options.userCSS){
				this.$ele_in.children('.button-slider').css({
					'position': 'absolute',
					'color': this.options.controlColor,
					'font-size': '50px',
					'font-family': '"Helvetica Neue", Helvetica, Arial, sans-serif',
					'line-height': '0.65em',
					'text-align': 'center',
					'background-color': this.options.controlBackgroundColor,
					'opacity': '0.5',
					'width': '40px',
					'height': '40px',
					'border-radius': '50%',
					'cursor': 'pointer'
				});
				
				//positionControl: 'left-right', // 'left-right', 'top-center', 'bottom-center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
				
				var css_previous, css_next;
				switch(this.options.positionControl){
					case 'left-right':
						css_previous = {
							'left': '10px',
							'top': '50%',
							'margin-top': '-20px'
						};
						css_next = {
							'right': '10px',
							'top': '50%',
							'margin-top': '-20px'
						};
						break;
					case 'top-center':
						css_previous = {
							'left': '50%',
							'top': '10px',
							'margin-left': '-50px'
						};
						css_next = {
							'left': '50%',
							'top': '10px',
							'margin-left': '10px'
						};
						break;
					case 'bottom-center':
						css_previous = {
							'left': '50%',
							'bottom': '10px',
							'margin-left': '-50px'
						};
						css_next = {
							'left': '50%',
							'bottom': '10px',
							'margin-left': '10px'
						};
						break;
					case 'top-left':
						css_previous = {
							'left': '10px',
							'top': '10px'
						};
						css_next = {
							'left': '70px',
							'top': '10px'
						};
						break;
					case 'top-right':
						css_previous = {
							'right': '70px',
							'top': '10px'
						};
						css_next = {
							'right': '10px',
							'top': '10px'
						};
						break;
					case 'bottom-left':
						css_previous = {
							'left': '10px',
							'bottom': '10px'
						};
						css_next = {
							'left': '70px',
							'bottom': '10px'
						};
						break;
					case 'bottom-right':
						css_previous = {
							'right': '70px',
							'bottom': '10px'
						};
						css_next = {
							'right': '10px',
							'bottom': '10px'
						};
						break;
				}
				
				this.$ele_in.children('.button-previous').css(css_previous);
				this.$ele_in.children('.button-next').css(css_next);
			}
			
			
			this.$ele_in.children('.button-previous').on('click', function(e){
				e && e.preventDefault();
				if(that.play_timer == false || that.on_transition == true) return;
				
				that._stopTimer(function(){
					that._startTimer(function(){
						that._prev(function(){
							that.is_pause = true; //Because the mouse pointer is on the button
						}); 
					});
				});
				
			});
			
			this.$ele_in.children('.button-next').on('click', function(e){
				e && e.preventDefault();
				if(that.play_timer == false || that.on_transition == true) return;
				
				that._stopTimer(function(){
					that._startTimer(function(){ 
						that._next(function(){
							that.is_pause = true; //Because the mouse pointer is on the button
						}); 
					});
				});
				
			});
			
			
			
			
			
		},
		
		_showProgress: function(percent){
			var that = this;
			
			if(!this.options.showProgress) return;
			
			if(this.$ele_in.children('.slider-progress').length  == 0){ 
				this.$ele_in.append('<div class="slider-progress"><div class="bar"></div></div>');
				this._$progress_bar = this.$ele_in.find('.slider-progress:first .bar');
				this.$ele_in.children('.slider-progress').css({
					'z-index': '4'
				});
				this._$progress_bar.css({
					'height': '100%'
				});
				
				if(!this.options.userCSS){
					this.$ele_in.children('.slider-progress').css({
						'position': 'absolute',
						'bottom': '0',
						'left': '0',
						'height': '1.5%',
						'width': '100%',
						'background-color': 'transparent',
						'opacity': '0.7'
					});
					
					this._$progress_bar.css({
						'width': '0%',
						'background-color': this.options.progressColor
					});
				}
				
			}
			
			if(typeof percent != 'undefined'){
				this._$progress_bar.css('width', percent+'%');
			}
			
		},
		
		_showButtons: function(){
			this.$ele_in.children('.button-slider').fadeIn();
		},
		
		_hideButtons: function(){
			this.$ele_in.children('.button-slider').fadeOut();
		},
		
		_playSlide: function(){
			var that = this;
			if(this.num_slides > 1){
				
				this._startTimer(function(){ that._next(); });
			}
			else { 
				this._next();
			}
			
			
			
		},
		
		_stopTimer: function(callback){
			var that = this;
			
			this.play_timer = false;
			var timer = setInterval(function(){
				if(that.active_timer == false) {
					clearInterval(timer);
					if(typeof callback == 'function') callback();
				}
			}, 100);
			
		},
		
		_startTimer: function(callback){
			var that = this;
			this.play_timer = true;
			this.active_timer = true;
			
			var start_time = (new Date()).getTime();
			var end_time = start_time + that.options.duration;
			var elapsed_time = 0;
			
			this._showProgress(0);
			callback();
			var frame = function(){
				
				if(that.play_timer == false) {
					that._showProgress(0);
					that.active_timer = false;
					return false;
				}
				
				var current_time = (new Date()).getTime();
				
				if(that.is_pause == true || that.on_transition){
					if(elapsed_time == 0) elapsed_time = current_time - start_time;
					
					that.requestFrame.call(window, frame);
					
				}
				else {
					if(elapsed_time > 0){
						start_time = current_time - elapsed_time;
						end_time = start_time + that.options.duration;
						elapsed_time = 0;
					}
					
					if(current_time > end_time) {
						that._showProgress(100);
						start_time = (new Date()).getTime();
						end_time = start_time + that.options.duration;
						that._next(function(){
							that._showProgress(0);
						});
					}
					else {
						var percent = ((current_time - start_time)/that.options.duration)*100;
						that._showProgress(percent);
					}
					
					that.requestFrame.call(window, frame);
				}
				
			};
			
			
			frame();
			
			
			
			
		},
		
		
		
		_isLoadedImages: function(arr_images, callback, index, arr_size){
			if(typeof arr_images == 'undefined' || arr_images.length < 1) {
				if(typeof callback == 'function') callback();
				return;
			}
			if(typeof index == 'undefined') {
				index = 0;
			}
			if(typeof arr_size == 'undefined') {
				arr_size = [];
			}
			
			var that = this;
			var src = arr_images[index];
			var img = new Image();
			
			img.onload = img.onerror = function(){
				
				arr_size.push({width: img.width, height: img.height});
				
				if(index == arr_images.length - 1 && typeof callback == 'function') callback(arr_size);
				else that._isLoadedImages(arr_images, callback, ++index, arr_size);
			};
			img.src = src;
		},
		
		_preloadImages: function(arr_images, callback){
			this._isLoadedImages(arr_images, callback);
		},
		
		_next: function(callback){
			var that = this;
			this.on_transition = true;
			this.is_pause = true;
			
			var $element;
			if(typeof this.current_slide == 'undefined') {
				this.current_slide = 0;
				$element = this.$sliders.eq(0);
			}
			else {
				if(this.current_slide < this.num_slides - 1) this.current_slide++;
				else this.current_slide = 0;
				$element = this.$sliders.eq(this.current_slide);
			}
			
			that._prev_next_process($element, callback);
			
			
		
		},
		
		_prev: function(callback){
			var that = this;
			this.on_transition = true;
			this.is_pause = true;
			
			var $element;
			
			if(this.current_slide > 0) this.current_slide--;
			else this.current_slide = this.num_slides - 1;
			$element = this.$sliders.eq(this.current_slide);
			
			that._prev_next_process($element, callback);
		
		},
		
		_prev_next_process: function($element, callback){
			this.$very_current_slide = $element;
			var that = this;
			
			var first_image_src = $element.data('images')[0];
			
			this._isLoadedImages($element.data('images'), function(arr_size){
				that.is_pause = false;
				that.$ele.css('visibility', 'visible');
				if($element.data('has-main-image')){
					$element.data('original', {'width': arr_size[0].width, 'height': arr_size[0].height});
				}
				else{
					var original_width, original_height;
					
					if(that.options.width && that.options.height){
						original_width = that.options.width;
						original_height = that.options.height;
					}
					else {
						var $active = that.$ele_projector.children('.active');
						original_width = $active.outerWidth(true);
						original_height = $active.outerHeight(true);
					
					}
					
					$element.data('original', {'width': original_width, 'height': original_height});
				}
					
				
				if(typeof callback == 'function') callback();
				
				
				
				//we resize slide size because slide size could be bigger than window size.
				that._resize($element, function(){
					
					that._updateNavigation();
					
					if($element.find('[data-pos]').length > 0){
						that._showAnimation($element, function(){
						
						});
					}
					else {
						that._showImage($element, function(){
							
						});
					}
				});
				
				
			});
		},
		
		_showImage: function($element, callback){
			var that = this;
			var transition = $element.data('transition') ? $element.data('transition') : this.options.transition;
			
			this._transition($element, transition, function(){
				that.on_transition = false;
				
				if(typeof callback == 'function') callback();
			});
			
		},
		
		/*
		 * callback : after transition
		 * callback_ani: after both transition and inner animation
		 */
		
		_showAnimation: function($element, callback, callback_ani){
			var that = this;
			var transition = $element.data('transition') ? $element.data('transition') : this.options.transition;
			this._transition($element, transition, function(){
				that.on_transition = false;
				
				if(typeof callback == 'function') callback();
				
				var arr_img_element = [];
				$element.children('[data-pos]').each(function(){
					var pos = $(this).data('pos');
					if(typeof pos == 'string')
						pos = $(this).data('pos').replace(/[\s\[\]\']/g, '').split(',');
					
					
					
					if(pos.length >= 2){
						$(this).css({
							'display': 'none',
							'position': 'absolute',
							'top': pos[0],
							'left': pos[1]
						});
					}
					
					arr_img_element.push(this);
				});
				that._playAnimation(arr_img_element, function(){
					if(typeof callback_ani == 'function') callback_ani();
				});
			});
			
			
			
			
		},
		
		_transition_prepare: function($element){
			var that = this;
			
			if($element.data('lazy-src')){
				$element.attr('src', $element.data('lazy-src'));
			}
			
			if($element.data('lazy-background') && $element.children('.lazy-background').length == 0){
				var html = '<img src="'+$element.data('lazy-background')+'" class="lazy-background"/>';
				$(html).prependTo($element).css({
					'position': 'absolute',
					'top': '0',
					'left': '0',
					'width': '100%',
					'height': '100%',
					'z-index': '-1'
				});
				
			}
			
			$element.find('[data-lazy-src]').each(function(){
				$(this).attr('src', $(this).data('lazy-src'));
			});
			
			$element.find('[data-lazy-background]').each(function(){
				$(this).css('background-image', 'url('+$(this).data('lazy-background')+')');
			});
			
			
		},
		
		
		_transition: function($element, transition, callback){
			var that = this;
			var $active = this.$ele_projector.children('.active:first');
			var reset = function(){
				$active.css({
					'display': 'none',
					'top': '0%',
					'left': '0%'
				});
				$active.css('z-index', '');
				$active.children('[data-pos]').css('display', 'none');
				$active.removeClass('active');
				$element.css({
					'display': 'block',
					'top': '0%',
					'left': '0%',
					'z-index': ''
				});
				$element.addClass('active');
			};
			
			if(transition == 'random')
				transition = this.all_transitions[Math.floor(Math.random()*this.all_transitions.length)];
			
			transition = transition.replace(/-/g, '_');
			var transition_func = eval('this._transition_'+transition);
			if(typeof transition_func == 'function') {
				this._transition_prepare($element);
				transition_func.call(this, $element, this.options.transitionSpeed, function(){
					reset();
					callback();
				});
			}
			else {
				this._transition_prepare($element);
				this._transition_slide($element, this.options.transitionSpeed, function(){
					reset();
					callback();
				});
			}
			 
		},
		
		
		_transition_slide_left: function($element, duration, callback){
			this._transition_slide($element, duration, callback, 'left');
		},
		
		_transition_slide_right: function($element, duration, callback){
			this._transition_slide($element, duration, callback, 'right');
		},
				
		_transition_slide_top: function($element, duration, callback){
			this._transition_slide($element, duration, callback, 'top');
		},
				
		_transition_slide_bottom: function($element, duration, callback){
			this._transition_slide($element, duration, callback, 'bottom');
		},
		
		_transition_slide: function($element, duration, callback, direction){
			
			var that = this;
			
			if(this.$ele_projector.children('.active').length == 0){
				$element.css({
					'display': 'block',
					'top': '0%',
					'left': '0%'
				});
				$element.addClass('active');
				if(typeof callback != 'undefined') callback();
				return;
			}
			else {
				
				
				if(typeof direction == 'undefined') direction = 'left';
				var pos_from_top, pos_from_left, pos_to_top, pos_to_left;
				
				switch(direction){
					case 'left':
						pos_from_top = '0%';
						pos_from_left = '100%';
						pos_to_top = '0%';
						pos_to_left = '-100%';
						break;
					case 'right':
						pos_from_top = '0%';
						pos_from_left = '-100%';
						pos_to_top = '0%';
						pos_to_left = '100%';
						break;
					case 'top':
						pos_from_top = '100%';
						pos_from_left = '0%';
						pos_to_top = '-100%';
						pos_to_left = '0%';
						break;
					case 'bottom':
						pos_from_top = '-100%';
						pos_from_left = '0%';
						pos_to_top = '100%';
						pos_to_left = '0%';
						break;
				}
				
				
				this.$ele_projector.append('<div class="slide-old" style="display: none;"></div>');
				this.$ele_projector.append('<div class="slide-new" style="display: none;"></div>');
				this.$ele_projector.children('.active:first').clone().appendTo(this.$ele_projector.children('.slide-old')).removeClass("active");
				$element.clone().appendTo(this.$ele_projector.children('.slide-new')).removeClass("active");
				
				var $slide_old = this.$ele_projector.children('.slide-old');
				var $slide_new = this.$ele_projector.children('.slide-new');
				
				
				//To prevent blink
				setTimeout(function(){
					$slide_old.css({
						'display': 'block',
						'position': 'absolute',
						'overflow': 'hidden',
						'top': '0',
						'left': '0',
						'width': '100%',
						'height': '100%',
						'z-index': '2'
					});
					
					$slide_new.css({
						'display': 'block',
						'position': 'absolute',
						'overflow': 'hidden',
						'top': pos_from_top,
						'left': pos_from_left,
						'width': '100%',
						'height': '100%',
						'z-index': '2'
					});
					
					$slide_old.children().show();
					$slide_new.children().show();
					
					
					that._animate(
						$slide_old,
						null,
						{
							'top': pos_to_top,
							'left': pos_to_left
						},
						duration,
						null,
						function(){
							$slide_old.remove();
						}
					);
					
					that._animate(
						$slide_new,
						null,
						{
							'top': '0%',
							'left': '0%'
						},
						duration,
						null,
						function(){
							$slide_new.remove();
							if(typeof callback == 'function') callback();
						}
					);
				}, 30);
				
				
				
			
				
			}
			
			
		},
		
		_transition_fade: function($element, duration, callback){
			var that = this;
			
			if(this.$ele_projector.children('.active').length == 0){
				$element.css({
					'display':'block',
					'left': '0%'
				});
				$element.addClass('active');
				if(typeof callback != 'undefined') callback();
				return;
			}
			else {
				
				this.$ele_projector.append('<div class="fade-old" style="display:none;"></div>');
				this.$ele_projector.append('<div class="fade-new" style="display:none;"></div>');
				this.$ele_projector.children('.active:first').clone().appendTo(this.$ele_projector.children('.fade-old')).removeClass("active");
				$element.clone().appendTo(this.$ele_projector.children('.fade-new')).removeClass("active");
				
				var $fade_old = this.$ele_projector.children('.fade-old');
				var $fade_new = this.$ele_projector.children('.fade-new');
				
				//To prevent blink
				setTimeout(function(){
					$fade_old.children().show();
					$fade_new.children().show();
					
					that._animate(
						$fade_old,
						{
							'display': 'block',
							'position': 'absolute',
							'overflow': 'hidden',
							'width': '100%',
							'height': '100%',
							'z-index': '2'
						},
						{
							'opacity': '0'
						},
						duration,
						null,
						function(){
							$fade_old.remove();
						}
					);
					
					that._animate(
						$fade_new,
						{
							'display': 'block',
							'position': 'absolute',
							'overflow': 'hidden',
							'width': '100%',
							'height': '100%',
							'z-index': '2',
							'opacity': '0'
						},
						{
							'opacity': '1'
						},
						duration,
						null,
						function(){
							$fade_new.remove();
							if(typeof callback == 'function') callback();
						}
					);
				}, 30);
				
				
				
		
			}
			
			
		},
		
		_transition_split3d: function($element, duration, callback){
			this._transition_split($element, duration, callback, true);
		},
		
		_transition_split: function($element, duration, callback, enable3d){
			var that = this;
			
			
			if(this.$ele_projector.children('.active').length == 0){
				$element.css({
					'display': 'block',
					'left': '0%'
				});
				$element.addClass('active');
				if(typeof callback != 'undefined') callback();
				return;
			}
			else {
				this.$ele_projector.append('<div class="split_up" style="display: none;"></div>');
				this.$ele_projector.append('<div class="split_down" style="display: none;"></div>');
				this.$ele_projector.children('.active:first').clone().appendTo(this.$ele_projector.children('.split_up')).removeClass("active");
				this.$ele_projector.children('.active:first').clone().appendTo(this.$ele_projector.children('.split_down')).removeClass("active");
				
				var $split_up = this.$ele_projector.children('.split_up');
				var $split_down = this.$ele_projector.children('.split_down');
				
				//To prevent blink
				setTimeout(function(){
					
					$split_up.children().css({
						'top': '0',
						'left': '0',
						'height': that.$ele_projector.height()+'px'
					});
					
					$split_down.children().css({
						'top': 'auto',
						'bottom': '0',
						'left': '0',
						'height': that.$ele_projector.height()+'px',
						'background-position': 'bottom left'
					});
					
					$element.css({
						'left': '0%',
						'display': 'block'
					});
					
					that.$ele_projector.children('.active:first').css('display', 'none');
					
					$css_split_up = {
										'top': '-50%',
										'opacity': '0'
									};
					
					$css_split_down = {
										'bottom': '-50%',
										'opacity': '0'
									};
							
					
					
					if(typeof enable3d != 'undefined' && enable3d == true){
						
						var deg = 10;
						if(that.current_slide%2 == 0) deg = -1*deg;
						
						that.$ele_projector.css({
							'perspective': '400px'
						});
						
						$.extend($css_split_up, {'transform': 'rotateZ('+deg+'deg) translateZ(238px)'});
						$.extend($css_split_down, {'transform': 'rotateZ('+(-1*deg)+'deg) translateZ(238px)'});
					}
					
					
					that._animate(
						$split_up,
						{
							'display': 'block',
							'position': 'absolute',
							'overflow': 'hidden',
							'z-index': '2',
							'top': '0',
							'left': '0',
							'width': '100%',
							'height': that.$ele_projector.height()/2+'px',
							'opacity': '1'
						},
						$css_split_up,
						duration,
						null,
						null
					);
					
					that._animate(
						$split_down,
						{
							'display': 'block',
							'position': 'absolute',
							'overflow': 'hidden',
							'z-index': '2',
							'bottom': '0',
							'left': '0',
							'width': '100%',
							'height': that.$ele_projector.height()/2+'px',
							'opacity': '1'
						},
						$css_split_down,
						duration,
						null,
						function(){
							$split_up.remove();
							$split_down.remove();
							if(typeof callback == 'function') callback();
						}
					);
					
					
				
				}, 30);
				
				
				
			}
			
			
		},
		
		_transition_door: function($element, duration, callback){
			var that = this;
			
			
			if(this.$ele_projector.children('.active').length == 0){
				$element.css({
					'display': 'block',
					'left': '0%'
				});
				$element.addClass('active');
				if(typeof callback != 'undefined') callback();
				return;
			}
			else {
				//this.$ele_projector.children('.active:first').css('z-index', '1');
				this.$ele_projector.append('<div class="split_left" style="display: none;"></div>');
				this.$ele_projector.append('<div class="split_right" style="display: none;"></div>');
				this.$ele_projector.children('.active:first').clone().appendTo(this.$ele_projector.children('.split_left')).removeClass("active");
				this.$ele_projector.children('.active:first').clone().appendTo(this.$ele_projector.children('.split_right')).removeClass("active");
				
				var $split_left = this.$ele_projector.children('.split_left');
				var $split_right = this.$ele_projector.children('.split_right');
				
				//To prevent blink
				setTimeout(function(){
					$split_left.children().css({
						'top': '0',
						'left': '0',
						'width': that.$ele_projector.width()+'px'
					});
					
					$split_right.children().css({
						'top': '0',
						'left': 'auto',
						'right': '0',
						'width': that.$ele_projector.width()+'px',
						'background-position': 'top right'
					});
					
					$element.css({
						'left': '0%',
						'display': 'block'
					});
					
					that.$ele_projector.children('.active:first').css('display', 'none');
					
					that._animate(
						$split_left,
						{
							'display': 'block',
							'position': 'absolute',
							'overflow': 'hidden',
							'z-index': '2',
							'top': '0',
							'left': '0',
							'width': that.$ele_projector.width()/2+'px',
							'height': '100%'
						},
						{
							'left': '-50%'
						},
						duration,
						null,
						function(){
							$split_left.remove();
						}
					);
					
					that._animate(
						$split_right,
						{
							'display': 'block',
							'position': 'absolute',
							'overflow': 'hidden',
							'z-index': '2',
							'top': '0',
							'right': '0',
							'width': that.$ele_projector.width()/2+'px',
							'height': '100%'
						},
						{
							'right': '-50%'
						},
						duration,
						null,
						function(){
							$split_right.remove();
							if(typeof callback == 'function') callback();
						}
					);
					
					
					
				}, 30);
				
				
				
				
				
				
				
			}
		},
		
		_transition_wave_left: function($element, duration, callback){
			this._transition_wave($element, duration, callback, 'left');
		},
		
		_transition_wave_right: function($element, duration, callback){
			this._transition_wave($element, duration, callback, 'right');
		},
				
		_transition_wave_top: function($element, duration, callback){
			this._transition_wave($element, duration, callback, 'top');
		},
				
		_transition_wave_bottom: function($element, duration, callback){
			this._transition_wave($element, duration, callback, 'bottom');
		},
		
		
		_transition_wave: function($element, duration, callback, direction){
			var that = this;
			
			
			if(this.$ele_projector.children('.active').length == 0){
				$element.css({
					'display': 'block',
					'left': '0%'
				});
				$element.addClass('active');
				if(typeof callback != 'undefined') callback();
				return;
			}
			else {
				
				this.$ele_projector.append('<div class="split_wave" style="display: none;"></div>');
				$element.clone().appendTo(this.$ele_projector.children('.split_wave')).removeClass("active");
				
				var $split_wave = this.$ele_projector.children('.split_wave');
				
				if(typeof direction == 'undefined') direction = 'left';
				var to_css;
				switch(direction){
					case 'left':
						$split_wave.children().css({
							'left': '0',
							'right': '',
							'top': '',
							'bottom': ''
						});
						$split_wave.css({
							'top': '0',
							'left': '0',
							'width': '0%',
							'height': '100%'
						});
						to_css = {
							'width': '100%',
							'opacity': '1'
						};
						break;
					case 'right':
						$split_wave.children().css({
							'left': '',
							'right': '0',
							'top': '',
							'bottom': ''
						});
						$split_wave.css({
							'top': '0',
							'right': '0',
							'width': '0%',
							'height': '100%'
						});
						to_css = {
							'width': '100%',
							'opacity': '1'
						};
						break;
					case 'top':
						$split_wave.children().css({
							'left': '',
							'right': '',
							'top': '0',
							'bottom': ''
						});
						$split_wave.css({
							'top': '0',
							'left': '0',
							'width': '100%',
							'height': '0%'
						});
						to_css = {
							'height': '100%',
							'opacity': '1'
						};
						break;
					case 'bottom':
						$split_wave.children().css({
							'left': '',
							'right': '',
							'top': '',
							'bottom': '0'
						});
						$split_wave.css({
							'bottom': '0',
							'left': '0',
							'width': '100%',
							'height': '0%'
						});
						to_css = {
							'height': '100%',
							'opacity': '1'
						};
						break;
				}
				
				$split_wave.children().show();
				
				//To prevent blink
				setTimeout(function(){
					var jQueryAnimation = false;
					//right and bottom animation shakes with css3 transition
					if(direction == 'right' || direction == 'bottom') jQueryAnimation = true;
					
					that._animate(
						$split_wave,
						{
							'display': 'block',
							'position': 'absolute',
							'overflow': 'hidden',
							'z-index': '2',
							'opacity': '0.3'
						},
						to_css,
						duration,
						null,
						function(){
							$split_wave.remove();
							if(typeof callback == 'function') callback();
						},
						jQueryAnimation
					);
				}, 30);
				
				
			
				
				
				
				
			}
		},
		
		_playAnimation: function(arr_img_element, callback){
			var that = this;
			var $img_element = $(arr_img_element.shift());
			
			switch($img_element.data('effect')){
				case 'fadein':
					this._animate(
						$img_element,
						{
							'display': 'block',
							'opacity': '0'
						},
						{
							'opacity': '1'
						},
						$img_element.data('duration') ? $img_element.data('duration') : 400,
						$img_element.data('delay') ? $img_element.data('delay') : null,
						function(){
							if(arr_img_element.length > 0) that._playAnimation(arr_img_element, callback);
							else callback();
						}
					);
					
					break;
				case 'move':
					$img_element.css({
						'display': 'block'
					});
					
					var pos = $img_element.data('pos');
					if(typeof pos == 'string')
						pos = $img_element.data('pos').replace(/[\s\[\]\']/g, '').split(',');
					
					if(pos.length == 4){
						this._animate(
							$img_element,
							{
								'opacity': '0'
							},
							{
								'top': pos[2],
								'left': pos[3],
								'opacity': 1
							},
							$img_element.data('duration') ? $img_element.data('duration') : 400,
							$img_element.data('delay') ? $img_element.data('delay') : null,
							function(){
								if(arr_img_element.length > 0) that._playAnimation(arr_img_element, callback);
								else callback();
							}
						);
						
					}
					break;
					
					
				
			}
			
			
		}
		
		
		
		
	};
	
	
	$.fn.DrSlider = function (options) {
		
		if (typeof options === 'string') {
			
			var data = $this.data('DrSlider');
			if (!data) $this.data('DrSlider', (data = new DrSlider(this, options)));
			
			return data[options].apply(data, Array.prototype.slice.call(arguments, 1));
		}
		
		return this.each(function () {
			var $this = $(this);
			
			var data = $this.data('DrSlider');
			if (!data) $this.data('DrSlider', (data = new DrSlider(this, options)));
			else data.constructor(this, options);
			
			data._init();
		});
		
	};
	
	
	$.fn.DrSlider.Constructor = DrSlider;
	
	
}(jQuery));




