import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import { NonIdealState } from '@blueprintjs/core';
import UserHeader from 'components/UserHeader/UserHeader';
import UserNav from 'components/UserNav/UserNav';
import UserEdit from 'components/UserEdit/UserEdit';
import PubPreview from 'components/PubPreview/PubPreview';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import { hydrateWrapper, apiFetch } from 'utilities';

require('./user.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	userData: PropTypes.object.isRequired,
};

class User extends Component {
	constructor(props) {
		super(props);
		this.state = {
			putUserIsLoading: false,
			putUserError: undefined,
		};
		this.handleUserEditSave = this.handleUserEditSave.bind(this);
	}

	handleUserEditSave(userObject) {
		this.setState({ putUserIsLoading: true, putUserError: undefined });
		return apiFetch('/api/users', {
			method: 'PUT',
			body: JSON.stringify(userObject)
		})
		.then(()=> {
			window.location.href = `/user/${this.props.userData.slug}`;
		})
		.catch((err)=> {
			this.setState({ putUserIsLoading: false, putUserError: err });
		});
	}

	render() {
		const userData = this.props.userData;
		const pubs = userData.pubs || [];
		const loginData = this.props.loginData;
		const selfProfile = loginData.id && userData.id === loginData.id;
		const mode = this.props.locationData.params.mode;
		const localCommunityId = this.props.communityData.id;
		const communityPubs = pubs.filter((pub)=> {
			return !localCommunityId || pub.communityId === localCommunityId;
		});
		const externalPubs = pubs.filter((pub)=> {
			return localCommunityId && pub.communityId !== localCommunityId;
		});
		const authoredPubs = communityPubs.filter((pub)=> {
			const collaborators = pub.collaborators || [];
			const isAuthor = collaborators.reduce((prev, curr)=> {
				if (curr.id === loginData.id && curr.Collaborator.isAuthor) { return true; }
				return prev;
			}, false);
			return isAuthor;
		});
		const pubsToRender = mode === 'authored' ? authoredPubs : communityPubs;

		return (
			<div id="user-container">
				<PageWrapper
					loginData={this.props.loginData}
					communityData={this.props.communityData}
					locationData={this.props.locationData}
					hideNav={this.props.locationData.isBasePubPub}
				>
					{mode === 'edit' &&
						<UserEdit
							userData={userData}
							onSave={this.handleUserEditSave}
							error={this.state.putUserError}
							isLoading={this.state.putUserIsLoading}
						/>
					}
					{mode !== 'edit' &&
						<div>
							<div className="container narrow">
								<div className="row">
									<div className="col-12">
										<UserHeader userData={userData} isUser={selfProfile} />
									</div>
								</div>
							</div>

							<div className="container narrow nav">
								<div className="row">
									<div className="col-12">
										<UserNav
											userSlug={userData.slug}
											activeTab={mode}
											allPubsCount={communityPubs.length}
											authoredPubsCount={authoredPubs.length}
										/>
									</div>
								</div>
							</div>
							{!!externalPubs.length &&
								<div className="container narrow nav">
									<div className="row">
										<div className="col-12">
											<div className="pt-callout external-pubs-wrapper">
												<a href={`https://www.pubpub.org/user/${userData.slug}`} className="pt-button pt-intent-primary">Go to Full Profile</a>
												<h5>{externalPubs.length} pub{externalPubs.length === 1 ? '' : 's'} in other communities.</h5>
												<div>{userData.firstName} has published in other PubPub communities. Click to go to their full profile.</div>
											</div>
										</div>
									</div>
								</div>
							}
							<div className="container narrow content">
								{pubsToRender.map((pub)=> {
									return (
										<div key={`pub-${pub.id}`} className="row">
											<div className="col-12">
												<PubPreview
													communityData={localCommunityId ? undefined : pub.community}
													title={pub.title}
													description={pub.description}
													slug={pub.slug}
													bannerImage={pub.avatar}
													size="medium"
													publicationDate={dateFormat(pub.firstPublishedAt, 'mmm dd, yyyy')}
													collaborators={pub.collaborators.filter((item)=> {
														return !item.Collaborator.isAuthor;
													})}
													authors={pub.collaborators.filter((item)=> {
														return item.Collaborator.isAuthor;
													})}
												/>
											</div>
										</div>
									);
								})}
								{!pubsToRender.length &&
									<NonIdealState
										visual="widget"
										title="No Pubs"
										action={selfProfile && !this.props.locationData.isBasePubPub
											? <a href="/pub/create" className="pt-button">Create New pub</a>
											: undefined
										}
									/>
								}
							</div>
						</div>
					}
				</PageWrapper>
			</div>
		);
	}
}

User.propTypes = propTypes;
export default User;

hydrateWrapper(User);
