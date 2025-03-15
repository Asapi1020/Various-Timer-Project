export interface BasicData {
	title: string;
	link: string;
	thumbnail: string;
	author: {
		name: string;
		link: string;
	};
}

export interface DetailData {
	preview: string;
	description: string;
	postedAt: Date;
	updatedAt?: Date;
}
