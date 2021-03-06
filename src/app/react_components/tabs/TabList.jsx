﻿/** @jsx React.DOM */
'use strict';

var Constants = require('../util/Constants.js');
var ContextMenu = require('../menus/ContextMenu.jsx');
var GroupLogic = require('../groups/Group.js');
var Strings = require('../util/Strings.js');
var Tab = require('./Tab.jsx');
var TabContextMenu = require('../menus/TabContextMenu.js');

var TabGroupList = require('../groups/TabGroupList.jsx');
var TabLogic = require('./Tab.js');
var ThumbnailCache = require('./ThumbnailCache.js');
module.exports = React.createClass({
 
  lastTabDragY: 0,
  pinOffset: 0,
  ready: false,
  backgroundStyle: {},
  selectedTabs: [],
  suppressTreeView: false,
  tabPlaceholder: document.createElement('li'),
  lastTabsToShow: [],
  lastPinnedTabs: {},
  tabsToShow: [],
  tabOpacity: 100,
  activeGroupChanged: function(id) {
    this.rerenderIfNeeded(id);
  },
  collapseTabs: function () {
    TabLogic.collapseTabs(this);
  },
  createNewGroup: function (name, color, filter) {
    this.refs[Constants.refs.TAB_GROUP_LIST].createNewGroup(name, color, filter);
  },
  expandTabs: function () {
    TabLogic.expandTabs(this);
  },
  
  getGroupList: function() {
    return this.refs[Constants.refs.TAB_GROUP_LIST];
  },
  getTabsOfGroup: function (groupId, callback){
    TabLogic.getTabsToShow(groupId, callback);
  },
  rerenderIfNeeded: function(groupId, onlyFetchTabs, column){
    
    if(typeof groupId === 'undefined' || groupId == null) {
      groupId = GroupManager.getActiveGroupId();
    }
    this.suppressTreeView = false;
    var self = this;
    TabLogic.getTabsToShow(groupId, function (tabsToShow) {
      
      var noTree = false;
      var same = true;
      //trees
      var activeGroup = GroupLogic.getActiveGroup();
   
      if (!(activeGroup && activeGroup.filter && !Persistency.getState().treeSettings.showTreesInFilters)) {
        if(typeof column !== 'undefined') {
          if (column == Constants.menus.menuBar.viewActions.TREE_VIEW) {
            
            same = false;
            tabsToShow  = TabLogic.createTabTree(tabsToShow);
          }
        }
        else {
          if (self.props.column == Constants.menus.menuBar.viewActions.TREE_VIEW) {
            tabsToShow  = TabLogic.createTabTree(tabsToShow);
          }
        }
      }
      else {
        self.suppressTreeView = true;
      }

      

      
      var mismatchIndex = 0;
      if (self.lastTabsToShow.length != tabsToShow.length){
        same = false;
      }
      else {
        if (self.lastTabsToShow.length == 0) {
          same = false;
        }
        for (var i = 0; i < self.lastTabsToShow.length; i++) {
          if(tabsToShow[i].id != self.lastTabsToShow[i].id
            || tabsToShow[i].visible != self.lastTabsToShow[i].visible
            || tabsToShow[i].pinned != self.lastTabsToShow[i].pinned) {
            same = false;
            mismatchIndex = i;
            break;
          }
        }
      }

      
      var tabs = TabManager.getTabs();
      for (var i = 0; i < tabs.length; i++) {
        var id = tabs[i].id;
        if (tabs[i].pinned){
          if(!self.lastPinnedTabs[id]) {
            self.lastPinnedTabs[id] = true;
            same = false;
          }
          
        }
        else {
          if(self.lastPinnedTabs[id]) {
            delete self.lastPinnedTabs[id];
            same = false;
          }
        }
      }
        
      
    
      self.tabsToShow = tabsToShow;
      if (!same){
        self.lastTabsToShow = self.lastTabsToShow.slice(0, mismatchIndex);
        for (var i = mismatchIndex; i < tabsToShow.length; i++) {
          self.lastTabsToShow.push({ id: tabsToShow[i].id, pinned: tabsToShow[i].pinned, visible: tabsToShow[i].visible });
        }
        if(!onlyFetchTabs) {
          TabLogic.setToCurrentTab(self);
          self.forceUpdate();
        }
      }

    });
   
  },
  searchTabs: function (query) {
    if (typeof query === 'string') {
      TabLogic.searchTabs(this, query);
    }
  },
  sortTabs: function (sort) {
    TabLogic.sortTabs(this, sort);
  },

  setClasses: function(){
    this.pinNodesClasses = classNames({
      'tab-pin-list': true,
      'hidden': !this.thereArePinnedNodes
    });
  },
  setPlaceHolderClass: function (props) {
    this.tabPlaceholderClasses = classNames({
      'tab-placeholder': true,
      'multi-column': props.column == Constants.menus.menuBar.viewActions.DOUBLE_COLUMN,
      'thumbnail': props.viewState == Constants.viewStates.THUMBNAIL_VIEW,
      'small': props.viewState == Constants.viewStates.SMALL_VIEW
    });
    this.tabPlaceholder.className = this.tabPlaceholderClasses;
  },
  setOneTimeClasses: function (state, props) {
    this.tabContainerClasses = classNames({
      'tab-container': true,
      'slim-bar': Persistency.getState().scrollBar == Constants.scrollBar.SLIM,
      'hidden-bar': Persistency.getState().scrollBar == Constants.scrollBar.HIDDEN,
      'animated': Persistency.getState().tabSettings.animated,
      'preview-shown': props.previewShown,
      'hidden': !state.isVisible
    });
    var backgroundInfo = Persistency.getState().background;
    this.tabOpacity = 100;
    if(backgroundInfo.show) {
      this.tabOpacity = backgroundInfo.tabOpacity;
      var opacity =  backgroundInfo.opacity/100;
      var imageValue ='url(' + (backgroundInfo.image) + ')';
      var positionValue = backgroundInfo.offset + '%';
      var filterValue = 'blur(' + backgroundInfo.blur +
        'px) grayscale(' + backgroundInfo.grayscale + '%)';

      this.backgroundStyle.backgroundImage = imageValue;
      this.backgroundStyle.opacity = opacity;
      this.backgroundStyle.backgroundPositionX = positionValue;
      if(backgroundInfo.useFilter) {
        this.backgroundStyle.WebkitFilter = filterValue;
      }
    }
    else {
      this.backgroundStyle.backgroundImage = '';
      this.backgroundStyle.backgroundPositionX = '';
      this.backgroundStyle.WebkitFilter = '';
    }
  },
  getInitialState: function () {
    return {
      
      isVisible: true,
     
      
    };
  },
  shouldComponentUpdate: function (nextProps, nextState) {
   
    if (this.state.isVisible != nextState.isVisible){
      this.setOneTimeClasses(nextState, this.props);
      
      this.rerenderIfNeeded(null, true);
      return true;
    }
    if (this.props.viewState != nextProps.viewState){
      this.rerenderIfNeeded(null, true);
      return true;
    }
    if (this.props.column != nextProps.column) {
     
      this.rerenderIfNeeded(null, false, nextProps.column);
      
      return true;
    }
    if (this.props.twoGroupColumns != nextProps.twoGroupColumns)
      return true;

    if (this.props.previewShown != nextProps.previewShown) {
      this.setOneTimeClasses(this.state, nextProps);
      return true;
    }
      
    //unly updated after restart
    /*if (this.props.showCloseButtons != nextProps.showCloseButtons)
      return true;
    if (this.props.showGroups != nextProps.showGroups)
      return true;
    if (this.props.showNewOnTabs != nextProps.showNewOnTabs)
      return true;*/

    return false;
  },
  onMessage: function(request, sender, callback) {
    if (typeof request.title !== 'undefined') {
      if (sender && sender.tab) {
        var id = sender.tab.id;
     
        var index = TabLogic.getTabIndex(id);
        if (index >=0 ) {
          var tab = TabManager.getTabs()[index];
          if (tab.title != request.title) {
            tab.title = request.title;
            if (this.refs[id]) {
              this.refs[id].setState({title:request.title});
            }
          }
        }
      }
    }
  },
  componentWillMount: function () {
    
    var self = this;
    this.setOneTimeClasses(this.state, this.props);
    this.setPlaceHolderClass(this.props);
    ThumbnailCache.init();
    TabLogic.init();
    chrome.runtime.onMessage.addListener(this.onMessage);
    /*chrome.windows.onFocusChanged.addListener(function (windowId) {
      
      if(windowId >= 0){
        
        self.rerenderIfNeeded();
      }
    });*/
    
    TabLogic.getTabs(this, function(forceUpdateTabs){
      TabLogic.setToCurrentTab(self);
     // ThumbnailCache.scheduleCleanup(self);
      GroupLogic.loadGroups();
      
      TabLogic.setUpEventListeners(self);
      self.ready = true;
      self.rerenderIfNeeded(null);
      self.props.handleStatisticsUpdate();
      for (var i = 0; i < forceUpdateTabs.length; i++) {
        if(self.refs[forceUpdateTabs[i].id]){
          self.refs[forceUpdateTabs[i].id].setState({
            title: forceUpdateTabs[i].title,
            favicon: forceUpdateTabs[i].favicon,
          });
        }
      }
    });

  },
  componentWillReceiveProps: function(nextProps) {
    this.setPlaceHolderClass(nextProps);
  },
  componentDidUpdate: function (prevProps, prevState) {
    if (this.thereArePinnedNodes) {
      this.pinOffset = React.findDOMNode(this.refs[Constants.refs.PIN_LIST]).offsetHeight;
    }


  },
  handleTabClicked: function (id, event) {
    TabLogic.handleTabClicked(this, id, event);
  },
  handleTabMouseUp: function (id, event) {
    TabLogic.handleTabMouseUp(this, id, event);
  },
  handleTabClosed: function (id) {
    TabLogic.handleTabClosed(id);
  },  
  tabDragStart: function (e) {
    TabLogic.tabDragStart(this, e);
  },
  tabDragOver: function (e) {
    TabLogic.tabDragOver(this, e);
  },
  tabDragEnd: function (e) {
    TabLogic.tabDragEnd(this, e);
  },
  handleEditTabGroup: function (group, callback){
    this.props.handleEditTabGroup(group, callback);
  },
  handleTabContextMenuOpen: function (props, event) {
    this.refs[Constants.refs.TAB_CONTEXT_MENU].handleContextMenu(props, event);
  },
  handleTabContextMenuSelect: function (id, action) {
    
    switch (action) {
      case Constants.menus.contextMenu.tabActions.SELECT_ALL:
        TabLogic.selectAllTabs(this, id);
        break;
      case Constants.menus.contextMenu.tabActions.NEW_TAB:
        chrome.tabs.create({});
        break;
      case Constants.menus.contextMenu.tabActions.CLONE_TAB:
        chrome.tabs.duplicate(id);
        break;
      case Constants.menus.contextMenu.tabActions.PIN_TAB:
        chrome.tabs.update(id, { pinned: true });
        break;
      case Constants.menus.contextMenu.tabActions.UNPIN_TAB:
        chrome.tabs.update(id, { pinned: false });
        break;
      case Constants.menus.contextMenu.tabActions.RELOAD_TAB:
        chrome.tabs.reload(id);
        break;
      case Constants.menus.contextMenu.tabActions.CLOSE_TAB:
        chrome.tabs.remove(id);
        break;
      case Constants.menus.contextMenu.tabActions.CLOSE_OTHER_TABS:
        TabLogic.closeOtherTabs(this, id)
        break;
      case Constants.menus.contextMenu.tabActions.REMOVE_TAB_FROM_GROUP:
        TabLogic.removeTabsFromGroup(this, id);
        break;
      case Constants.menus.contextMenu.tabActions.CLOSE_TABS_BELOW:
        TabLogic.closeTabsBelow(id);
        break;
    }
  },


  handleTabMouseEnter: function(id) {
    var index = TabLogic.getTabIndex(id);
    
    if (index >= 0) {
      var tab = TabManager.getTabs()[index];
      if (tab) {
        this.props.handlePreview(ThumbnailCache.getThumbnail(tab), tab.title || tab.url);
      }
    }
    
    
  },

  handleTabCollapsed: function (id){
    TabLogic.handleTabCollapsed(this, id);
  },
  render: function () {
    
    if(!this.ready) {
      return (
        <div>
        </div>
      );
    }
    
  
    var activeTabId = TabManager.getActiveTabId();
    
    var column = (this.suppressTreeView && this.props.column 
      == Constants.menus.menuBar.viewActions.TREE_VIEW)?Constants.menus.menuBar.viewActions.SINGLE_COLUMN:this.props.column;

    var tabNodes = [];
    var pinNodes = [];
    var tabs = TabManager.getTabs();
    this.thereArePinnedNodes = false;
    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      if(tab.pinned){
          this.thereArePinnedNodes = true;
          pinNodes.push(
            (
            <Tab
              ref = { tab.id }
              id = { tab.id }
              index = { i }
              key = { tab.id }
              title = { tab.title }

              isActive = { tab.id == activeTabId }
              onContextMenu = { this.handleTabContextMenuOpen }
              onDragEnd = { this.tabDragEnd }
              onDragStart = { this.tabDragStart }
              onTabClicked = { this.handleTabClicked }
              onTabClosed = { this.handleTabClosed }
              onMouseEnter = { this.handleTabMouseEnter }
              onMouseUp = { this.handleTabMouseUp }

              favicon = { tab.favicon }
              isLoading = { tab.status == 'loading' }
              isPinned = { true }
              opacity = { this.tabOpacity }
              showClose = { false }
              showNewOnTabs = { this.props.showNewOnTabs }
            />
            ));
      }
    }
    for (var i = 0; i < this.tabsToShow.length; i++) {
      var tab = this.tabsToShow[i];
      if(tab.visible){
        if (!tab.pinned) {
          tabNodes.push(
            (
            <Tab
              ref = { tab.id }
              id = { tab.id }
              index = { i }
              key = { tab.id }
              title = { tab.title || tab.url }

              onContextMenu = { this.handleTabContextMenuOpen }
              onDragEnd = { this.tabDragEnd }
              onDragStart = { this.tabDragStart }
              onTabClicked = { this.handleTabClicked }
              onTabClosed = { this.handleTabClosed }
              onMouseEnter = { this.handleTabMouseEnter }
              onMouseUp = { this.handleTabMouseUp }
              column = { column }
              favicon = { tab.favicon }
              isLoading = { tab.status == 'loading' }
              isActive = { false}
              isSelected = { this.selectedTabs.indexOf(tab.id) >= 0 }

            
              level = { tab.level }
              firstNode = { tab.firstNode }
              parentNode = { tab.parentNode }
              collapsed = { tab.collapsed }
              onTabCollapsed = { this.handleTabCollapsed }

              newlyCreated = { tab.newlyCreated }
              opacity = { this.tabOpacity }
              showClose = { this.props.showCloseButtons }
              showNewOnTabs = { this.props.showNewOnTabs }
              thumbnail = { ThumbnailCache.getThumbnail(tab) }
              viewState = { this.props.viewState }

            />

            )
          );
        }
       
      }
    }
   
    
    this.setClasses();
   
    return (
      <div
        className = { this.tabContainerClasses }>
        
        <div
          className = "tab-list-container">
          <div 
            className = { 'tab-list-background' } 
            style = { this.backgroundStyle }/>
          <ContextMenu
            ref = { Constants.refs.TAB_CONTEXT_MENU }
            items = { TabContextMenu }
            handleSelect = { this.handleTabContextMenuSelect }/>
          
          <TabGroupList
            ref = { Constants.refs.TAB_GROUP_LIST }
            isVisible = { this.props.showGroups }
            parent = {this}
            handleNewTabGroup = { this.props.handleNewTabGroup }
            handleEditTabGroup = { this.handleEditTabGroup }
            twoColumns = {this.props.twoGroupColumns}/>

          <div
            className = "tab-list"
            onMouseLeave = { this.props.handleMouseLeave }>
            <ul
              ref= { Constants.refs.PIN_LIST }
              className = { this.pinNodesClasses }>
              { pinNodes }
            </ul>
            <ul
              className = "unpinned-tabs"
              onDragOver = { this.tabDragOver }>
              { tabNodes }
            </ul>
          </div>
        </div>
      </div>
    );
  }
});
