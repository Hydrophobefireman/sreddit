export interface RedditApiResponse {
  data: {
    children: Array<{
      data: {
        title: string;
        url_overridden_by_dest: string;
        permalink: string;
      };
    }>;
    after: string;
  };
}
