/*!
 * Agile Notes 1.0
 *
 * Copyright 2013, Sihong Zhu and other contributors
* Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
* and GPL (http://www.opensource.org/licenses/gpl-license.php) version 2 licenses.
* This software is not distributed under version 3 or later of the GPL.
 *
 * http://agilemore.com/agilenotes
 */

(function( $, undefined ) {

$.widget( "an.swipewidget", $.an.widget, {
	_create: function() {
        $.an.widget.prototype._create.apply(this, arguments);
        var o = this.options;
        if(o.mobile){
            o.swipeContent = o.swipeContent || '<li>no content</li>';
            o.swipeIcon = o.swipeIcon || '<b class="swipe-icon-active"></b>';
            o.swipeindex = o.swipeindex || 0;
            o.autoSwipe = o.autoSwipe || false;
            o.swipeduration = o.swipeduration || 2000;
            o.width = o.width || '100';
            this.element.addClass("an-swipewidget");
            var wrap = $('<div class="swipeBox"></div>'),
                contentList = $('<ul class="swipeList c"></ul>'),
                iconList = $('<div class="iconList"></div>');
            contentList.append(o.swipeContent);
            contentList.find('li').each(function(i){
                var icon = '<b></b>';
                if(i == o.swipeindex){
                    icon = '<b class="swipe-icon-active"></b>';
                }
                iconList.append($(icon));
            });
            contentList.width(o.width * contentList.find('li').length+'%');
            contentList.find('li').width(o.width / contentList.find('li').length+'%');

			wrap.append(contentList).append(iconList).appendTo(this.element.find('.content'));

            var pos = {},t = null;
            pos.index = o.swipeindex;
            pos.itemLen = contentList.find('li').length;
            pos.itemWidth = contentList.find('li').eq(0).outerWidth(true);

           this.element.bind('touchstart.swipewidget', function(e){
             var e = e.originalEvent.touches[0];
             pos.x = e.pageX;
             pos.y = e.pageY;
             pos.dx = 0;
             pos.dy = 0;
             pos.Left = contentList.offset().left;
             pos.target = e.target.tagName.toLowerCase() == 'li' ? e.target : $(e.target).closest('li');
             pos.index = contentList.find('li').index($(pos.target));
             pos.itemWidth = $(pos.target).outerWidth(true);

             clearTimeout(t);
             t = null;
          })

          this.element.bind('touchmove.swipewidget', function(e){
             e.preventDefault();  //important
             var e = e.originalEvent.touches[0];
             pos.dx = e.pageX - pos.x;
             pos.dy = e.pageY - pos.y;
             contentList.css({"left":parseInt(pos.dx + pos.Left)+"px"});
          })

          this.element.bind('touchend.swipewidget', function(e){
              var posLeft = 0, posIndex = 0;
              if(pos.index == 0 && pos.dx > 0){
                 posLeft = 0;
                 posIndex = 0;
              }else if(pos.index == pos.itemLen-1 && pos.dx < 0){
                  posLeft = -pos.itemWidth*pos.index;
                  posIndex = pos.index;
              }else{
                if(Math.abs(pos.dx) >= pos.itemWidth/2){
                    if(pos.dx > 0){
                        posLeft = -pos.itemWidth*(pos.index-1);
                        posIndex = pos.index-1;
                    }else if(pos.dx < 0){
                        posLeft = -pos.itemWidth*(pos.index+1);
                        posIndex = pos.index+1;
                    }
                }else{
                    posLeft = -pos.itemWidth*(pos.index);
                    posIndex = pos.index;
                }
              }
              setActive(contentList, posLeft, posIndex);
              if(o.autoSwipe && o.mode != 'design'){
                 t = setTimeout(function(){o.autoRun(contentList, posLeft, posIndex);},o.swipeduration);
              }
          })

          function setActive(obj, posLeft, index){
            iconList.find('b').eq(index).addClass('swipe-icon-active').siblings().removeClass('swipe-icon-active');
            //obj.css({'left':posLeft + 'px'});
            obj.css({'left':-index*100+'%'});
          }

          o.autoRun = function(obj, posLeft, index){
            if(index <= 0 || index > (pos.itemLen - 1)){
                index = 0;
            }
            posLeft = -pos.itemWidth*index;
            setActive(obj, posLeft, index);
            index ++;
            pos.index++;
            t = setTimeout(function(){o.autoRun(obj, posLeft, index);},o.swipeduration);
          }
        }
	},

	_browser:function(){
		var o = this.options;
        if(o.autoSwipe){
           o.autoRun(this.element.find('.swipeList'), 0, 0);
        }
	},

	_edit:function(){
		var o = this.options;
        if(o.autoSwipe){
           o.autoRun(this.element.find('.swipeList'), 0, 0);
        }
	},

    _design: function(){
		var o = this.options;

    },

	destroy: function() {
		this.element.removeClass("an-swipewidget");
        this.element.unbind('swipewidget');
        this.content.remove();
		return $.an.widget.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
