import RSS from 'rss';
import app from '../server';
import { Community, Pub, User, Collaborator, Collection } from '../models';

app.get('/rss.xml', (req, res)=> {
	const hostname = req.hostname;
	const whereQuery = hostname.indexOf('.pubpub.org') > -1
		? { subdomain: hostname.replace('.pubpub.org', '') }
		: { domain: hostname };

	return Community.findOne({
		where: whereQuery,
		attributes: ['id', 'subdomain', 'domain', 'title', 'description', 'favicon'],
		include: [
			{
				model: Pub,
				as: 'pubs',
				where: {
					firstPublishedAt: { $ne: null },
				},
				through: { attributes: [] },
				attributes: ['id', 'title', 'slug', 'firstPublishedAt', 'description', 'avatar', 'communityId'],
				separate: true,
				include: [
					{
						model: Collection,
						as: 'collections',
						where: { isPublic: true },
						attributes: ['id', 'isPublic'],
						through: { attributes: [] },
					},
					{
						model: User,
						as: 'collaborators',
						attributes: ['id', 'fullName'],
						through: { attributes: { exclude: ['updatedAt'] } },
					},
					{
						required: false,
						model: Collaborator,
						as: 'emptyCollaborators',
						where: { userId: null },
						attributes: { exclude: ['updatedAt'] },
					},
				]
			},
		],
	})
	.then((communityData)=> {
		if (!communityData) {
			throw new Error('No communityData');
		}
		const communityUrl = communityData.domain
			? `https://${communityData.domain}`
			: `https://${communityData.subdomain}.pubpub.org`;
		const feed = new RSS({
			title: communityData.title,
			description: communityData.description,
			feed_url: `${communityUrl}/rss.xml`,
			site_url: communityUrl,
			image_url: communityData.favicon,
			webMaster: 'pubpub@media.mit.edu',
			language: 'en',
			pubDate: new Date(),
			ttl: '60',
		});

		communityData.pubs.sort((foo, bar)=> {
			if (foo.firstPublishedAt < bar.firstPublishedAt) { return 1; }
			if (foo.firstPublishedAt < bar.firstPublishedAt) { return -1; }
			return 0;
		}).forEach((pub)=> {
			const authors = [
				...pub.collaborators,
				...pub.emptyCollaborators.map((item)=> {
					return {
						id: item.id,
						initials: item.name[0],
						fullName: item.name,
						Collaborator: {
							id: item.id,
							isAuthor: item.isAuthor,
							permissions: item.permissions,
							order: item.order,
							createdAt: item.createdAt,
						}
					};
				})
			].filter((item)=> {
				return item.Collaborator.isAuthor;
			}).map((item)=> {
				return item.fullName;
			}).join(', ');

			feed.item({
				title: pub.title,
				description: pub.description,
				url: `${communityUrl}/pub/${pub.slug}`,
				guid: pub.id,
				author: authors,
				date: pub.firstPublishedAt,
				enclosure: {
					url: pub.avatar
				}
			});
		});

		const outputXML = feed.xml();
		res.set('Content-Type', 'text/xml');
		return res.send(outputXML);
	})
	.catch((err)=> {
		console.log(err);
		return res.status(200).json('Error producing RSS feed');
	});
});
