/** @jsx React.DOM */
'use strict';

var Constants = require('../util/Constants.js');
var MenuBarMenu = require('./MenuBarMenu.jsx');
var Strings = require('../util/Strings.js');
var ViewMenu = require('./ViewMenu.js');
var SortMenu = require('./SortMenu.js');

module.exports = React.createClass({
  getInitialState: function () {
    return {
      openedMenu: Constants.menus.menuBar.openStates.NONE,
      showingRecentTabs: false
    }
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    if (this.state.openedMenu != nextState.openedMenu)
      return true;
    if (this.state.showingRecentTabs != nextState.showingRecentTabs)
      return true;
    return false;
  },
  handleMenuOpen: function (menu) {
    this.setState({ openedMenu: menu });
  },
  handleMenuSelect: function (action) {
    this.setState({ openedMenu: Constants.menus.menuBar.openStates.NONE });
    
    switch (action) {
      case Constants.viewStates.NORMAL_VIEW:
      case Constants.viewStates.SMALL_VIEW:
      case Constants.viewStates.COMPACT_VIEW:
      case Constants.viewStates.THUMBNAIL_VIEW:
        this.props.handleViewChange(action);
        break;
      case Constants.menus.menuBar.viewActions.SINGLE_COLUMN:
      case Constants.menus.menuBar.viewActions.DOUBLE_COLUMN:
      case Constants.menus.menuBar.viewActions.TREE_VIEW:
        this.props.handleColumnChange(action);
        break;
      case Constants.menus.menuBar.viewActions.SINGLE_COLUMN_GROUP:
      case Constants.menus.menuBar.viewActions.DOUBLE_COLUMN_GROUP:
        this.props.handleGroupColumnChange(action);
        break;

      case Constants.sortModes.TITLE_ASC:
      case Constants.sortModes.URL_ASC:
      case Constants.sortModes.VISITED_ASC:
      case Constants.sortModes.OPENED_ASC:
      case Constants.sortModes.TITLE_DESC:
      case Constants.sortModes.URL_DESC:
      case Constants.sortModes.VISITED_DESC:
      case Constants.sortModes.OPENED_DESC:
        this.props.handleSort(action);
        break;
      case Constants.menus.menuBar.viewActions.SHOW_PREVIEW:
        this.props.handlePreviewDisplay(true);
        break;
      case Constants.menus.menuBar.viewActions.HIDE_PREVIEW:
        this.props.handlePreviewDisplay(false);
        break;
      default:
        break;
    }
  },
  handleNewTab: function () {
    chrome.tabs.create({});
  },
  handleNewTabGroup: function () {
    this.props.handleNewTabGroup();
  },  
  handleShowRecentTabs: function () {
    if(this.state.showingRecentTabs) {
      this.props.showRecentTabs(false);
      this.setState({ showingRecentTabs: false });
    }
    else{
      this.props.showRecentTabs(true);
      this.setState({ showingRecentTabs: true });
    }
  },
  viewMenuActiveFilter: function (item) {
    var state = Persistency.getState();
    var viewState = state.tabSettings.viewState;
    var column = state.tabSettings.column;
    var twoGroupColumns = state.groupSettings.twoGroupColumns;
    var showPreview = state.previewArea.show;

    if (item.action == viewState
      ||item.action == column ){
      return true;
    }
    else if (twoGroupColumns && item.action == Constants.menus.menuBar.viewActions.DOUBLE_COLUMN_GROUP
      || (!twoGroupColumns && item.action == Constants.menus.menuBar.viewActions.SINGLE_COLUMN_GROUP)) {
      return true;
    }
    else if (showPreview && item.action == Constants.menus.menuBar.viewActions.SHOW_PREVIEW
      || (!showPreview && item.action == Constants.menus.menuBar.viewActions.HIDE_PREVIEW)){
      return true;
    }
    return false;
  },
  render: function () {
    var self = this;
    var tabGroupClasses = classNames({
      'hidden': !this.props.showGroups
    });
    var showRecentClasses = classNames({
      'fa fa-trash': !this.state.showingRecentTabs,
      'fa fa-navicon': this.state.showingRecentTabs
    });
    var showRecentButtonClasses = classNames({
      'selected': this.state.showingRecentTabs
    });
     return (
       <div
         className = "menu-bar">
         <button
           title = { Strings.menuBar.NEW_TAB }
           onClick = { this.handleNewTab }>
           <i
             className = "fa fa-plus"/>
         </button>
         <button
           className = { tabGroupClasses }
           title = { Strings.menuBar.NEW_TAB_GROUP }
           onClick = { this.handleNewTabGroup }>
           <i
             className = "fa fa-plus-square"/>
         </button>
         <button
           title = { Strings.menuBar.SORT }
           onClick = { function(){self.handleMenuOpen(Constants.menus.menuBar.openStates.SORT)} }>
           <i
           className = "fa fa-sort-alpha-asc"/>
         </button>
         <button
           title = { Strings.menuBar.VIEW_MENU }
           onClick = { function(){self.handleMenuOpen(Constants.menus.menuBar.openStates.VIEW)} }>
           <i
             className = "fa fa-paint-brush"/>
         </button>
         <MenuBarMenu
           items = { ViewMenu }
           handleSelect = { this.handleMenuSelect }
           notchOffset = { this.props.showGroups?65:58 }
           activeFilter = {this.viewMenuActiveFilter}
           isVisible = { this.state.openedMenu == Constants.menus.menuBar.openStates.VIEW }/>
         <MenuBarMenu
           items = { SortMenu }
           handleSelect = { this.handleMenuSelect }
           notchOffset = { this.props.showGroups?46:35 }
           isVisible = { this.state.openedMenu == Constants.menus.menuBar.openStates.SORT }/>
         <button
           className = { showRecentButtonClasses }
           title = { this.state.showingRecentTabs?Strings.menuBar.TABS:Strings.menuBar.CLOSED_TABS }
           onClick = { this.handleShowRecentTabs }>
           <i
           className = { showRecentClasses }/>
         </button>
       </div>
     );
  }
});
