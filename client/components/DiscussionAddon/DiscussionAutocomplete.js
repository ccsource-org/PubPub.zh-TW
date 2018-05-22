import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { MenuItem } from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/labs';
import fuzzysearch from 'fuzzysearch';
import Avatar from 'components/Avatar/Avatar';

require('./discussionAutocomplete.scss');

const propTypes = {
	threads: PropTypes.array.isRequired,
	onSelect: PropTypes.func,
	placeholder: PropTypes.string,
};

const defaultProps = {
	onSelect: ()=>{},
	placeholder: 'Select a discussion thread...',
};

class DiscussionAutocomplete extends Component {
	constructor(props) {
		super(props);
		this.getFilteredItems = this.getFilteredItems.bind(this);
		this.state = {
			items: this.getFilteredItems(props, ''),
			value: '',
		};
		this.filterItems = this.filterItems.bind(this);
		this.handleSelect = this.handleSelect.bind(this);
	}

	componentWillReceiveProps(nextProps) {
		this.setState({
			items: this.getFilteredItems(nextProps, ''),
		});
	}

	getFilteredItems(props, query) {
		return props.threads.map((item)=> {
			if (item[0].title) { return item; }
			const outputItem = [...item];
			outputItem[0].title = `Discussion by ${item[0].author.fullName}`;
			return outputItem;
		}).filter((item)=> {
			const fuzzyMatchTitle = fuzzysearch(query.toLowerCase(), item[0].title.toLowerCase());
			const fuzzyMatchAuthor = fuzzysearch(query.toLowerCase(), item[0].author.fullName.toLowerCase());
			return fuzzyMatchTitle || fuzzyMatchAuthor;
		}).sort((foo, bar)=> {
			if (foo.title < bar.title) { return -1; }
			if (foo.title > bar.title) { return 1; }
			return 0;
		});
	}

	filterItems(evt) {
		const query = evt.target.value;
		const filteredItems = this.getFilteredItems(this.props, query);

		this.setState({
			value: query,
			items: filteredItems,
		});
	}

	handleSelect(data) {
		this.props.onSelect(data);
		this.setState({ value: '' });
	}


	render() {
		return (
			<div className="discussion-autocomplete">
				<Suggest
					className="input"
					items={this.state.items}
					inputProps={{
						value: this.state.value,
						onChange: this.filterItems,
						placeholder: this.props.placeholder,
					}}
					inputValueRenderer={(item) => { return item.title; }}
					itemRenderer={({ item, handleClick, isActive })=> {
						const discussion = item[0];
						return (
							<li key={item[0].id}>
								<a role="button" tabIndex={-1} onClick={handleClick} className={isActive ? 'pt-menu-item pt-active' : 'pt-menu-item'}>
									<div className="avatar-wrapper">
										<Avatar
											width={20}
											userInitials={discussion.author.intials}
											userAvatar={discussion.author.avatar}
										/>
									</div>

									<div className="details">
										<div className="title">{discussion.title}</div>
										<div className="count">{item.length} repl{item.length === 1 ? 'y' : 'ies'}</div>
									</div>
								</a>
							</li>
						);
					}}
					onItemSelect={this.handleSelect}
					noResults={<MenuItem disabled text="No results" />}
					popoverProps={{ popoverClassName: 'pt-minimal discussion-autocomplete-popover' }}
				/>
			</div>
		);
	}
}

DiscussionAutocomplete.propTypes = propTypes;
DiscussionAutocomplete.defaultProps = defaultProps;
export default DiscussionAutocomplete;
