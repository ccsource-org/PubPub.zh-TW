import React from 'react';
import PropTypes from 'prop-types';

require('./discussionSortList.scss');

const propTypes = {
	selected: PropTypes.array.isRequired,
	onSelect: PropTypes.func.isRequired,
};

const DiscussionSortList = (props)=> {
	const options = [
		{ id: 0, slug: 'newestThread', title: 'Newest Thread' },
		{ id: 1, slug: 'oldestThread', title: 'Oldest Thread' },
		{ id: 2, slug: 'newestReply', title: 'Most Recent Reply' },
		{ id: 3, slug: 'oldestReply', title: 'Least Recent Reply' },
		{ id: 4, slug: 'mostReplies', title: 'Most Replies' },
		{ id: 5, slug: 'leastReplies', title: 'Least Replies' },
	];
	return (
		<div className="discussion-authors-list-component pt-menu pt-elevation-1">
			<li className="pt-menu-header"><h6>Filter by Author</h6></li>

			{options.map((option)=> {
				const handleClick = ()=> { props.onSelect(option.slug); };
				return (
					<li>
						<div key={`option-${option.id}`} className="pt-menu-item" onClick={handleClick}>
							<div className="color">
								{props.selected === option.slug &&
									<span className="pt-icon-standard pt-icon-small-tick" />
								}
							</div>
							<div className="title">{option.title}</div>
						</div>
					</li>
				);
			})}
		</div>
	);
};

DiscussionSortList.propTypes = propTypes;
export default DiscussionSortList;
