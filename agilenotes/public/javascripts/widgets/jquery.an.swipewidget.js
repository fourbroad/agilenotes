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

    options:{
        swipeContent : '<li>no content</li>',
        swipeIcon : '<b class="swipe-icon-active"></b>',
        swipeindex : 0,
        swipeContent : '<li>no content</li>',
        swipeduration : false,
        swipeduration : 2000,
        width : '100'
    },

	_create: function() {
        $.an.widget.prototype._create.apply(this, arguments);
        var o = this.options;
        if(o.mobile){
            var self = this;
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
            self.pos = {};
            var pos = self.pos;
            pos.t = null;
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

             clearTimeout(pos.t);
             pos.t = null;
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
              self._setActive(contentList, posLeft, posIndex);
              if(o.autoSwipe && o.mode != 'design'){
                 pos.t = setTimeout(function(){self.autoRun(contentList, posLeft, posIndex);},o.swipeduration);
              }
          })
        }
	},
    _setActive : function(obj, posLeft, index){
        var self = this;
        //obj.css({'left':posLeft + 'px'});
        obj.css({'left':-index*100+'%'});
        setTimeout(function(){
            self.element.find('.iconList b').eq(index).addClass('swipe-icon-active').siblings().removeClass('swipe-icon-active');
        },100);  //after css3 transition complete
    },
    autoRun:function(obj, posLeft, index){
        var self = this, o = this.options, pos = this.pos;
        if(index <= 0 || index > (pos.itemLen - 1)){
            index = 0;
        }
        posLeft = -pos.itemWidth*index;
        self._setActive(obj, posLeft, index);
        index ++;
        pos.index++;
        pos.t = setTimeout(function(){self.autoRun(obj, posLeft, index);},o.swipeduration);
   },
	_browser:function(){
		var o = this.options;
        if(o.autoSwipe){
           this.autoRun(this.element.find('.swipeList'), 0, 0);
        }
	},

	_edit:function(){
		var o = this.options;
        if(o.autoSwipe){
           this.autoRun(this.element.find('.swipeList'), 0, 0);
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
