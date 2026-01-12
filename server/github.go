package server

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"

	"github.com/kjk/common/u"
)

const (
	githubServer = "https://api.github.com"
)

// Gist describes a gist
// https://developer.github.com/v3/gists/#get-a-single-gist
type Gist struct {
	// comes from the API
	URL         string               `json:"url"`
	ForksURL    string               `json:"forks_url"`
	CommitsURL  string               `json:"commits_url"`
	ID          string               `json:"id"`
	NodeID      string               `json:"node_id"`
	GitPullURL  string               `json:"git_pull_url"`
	GitPushURL  string               `json:"git_push_url"`
	HTMLURL     string               `json:"html_url"`
	Files       map[string]*GistFile `json:"files"`
	Public      bool                 `json:"public"`
	CreatedAt   string               `json:"created_at"`
	UpdatedAt   string               `json:"updated_at"`
	Description string               `json:"description"`
	Comments    int64                `json:"comments"`
	User        json.RawMessage      `json:"user"`
	CommentsURL string               `json:"comments_url"`
	Owner       *GitOwner            `json:"owner"`
	Forks       json.RawMessage      `json:"forks"`
	History     []*GistHistory       `json:"history"`
	Truncated   bool                 `json:"truncated"`

	// set by us
	Raw string `json:"-"`
}

// GistFile represents a gist file
type GistFile struct {
	Filename  string `json:"filename"`
	Type      string `json:"type"`
	Language  string `json:"language"`
	RawURL    string `json:"raw_url"`
	Size      int64  `json:"size"`
	Truncated bool   `json:"truncated"`
	Content   string `json:"content"`
}

// GistHistory represents gist history
type GistHistory struct {
	User         GitOwner        `json:"user"`
	Version      string          `json:"version"`
	CommittedAt  string          `json:"committed_at"`
	ChangeStatus GitChangeStatus `json:"change_status"`
	URL          string          `json:"url"`
}

// GitChangeStatus represents gist change status
type GitChangeStatus struct {
	Total     int64 `json:"total"`
	Additions int64 `json:"additions"`
	Deletions int64 `json:"deletions"`
}

// GitOwner represents owner of the gist
type GitOwner struct {
	Login             string `json:"login"`
	ID                int64  `json:"id"`
	NodeID            string `json:"node_id"`
	AvatarURL         string `json:"avatar_url"`
	GravatarID        string `json:"gravatar_id"`
	URL               string `json:"url"`
	HTMLURL           string `json:"html_url"`
	FollowersURL      string `json:"followers_url"`
	FollowingURL      string `json:"following_url"`
	GistsURL          string `json:"gists_url"`
	StarredURL        string `json:"starred_url"`
	SubscriptionsURL  string `json:"subscriptions_url"`
	OrganizationsURL  string `json:"organizations_url"`
	ReposURL          string `json:"repos_url"`
	EventsURL         string `json:"events_url"`
	ReceivedEventsURL string `json:"received_events_url"`
	Type              string `json:"type"`
	SiteAdmin         bool   `json:"site_admin"`
}

var (
	didNotifyUsingToken bool
)

func getGithubToken() string {
	token := os.Getenv("GITHUB_TOKEN")
	if token == "" {
		return token
	}
	if !didNotifyUsingToken {
		logf("GITHUB_TOKEN set, using it for GitHub API requests\n")
		didNotifyUsingToken = true
	}
	return ""
}

// JSONRequest represents a JSON request
type JSONRequest struct {
	Server    string
	URIPath   string
	Etag      string // used for header If-None-Match: ${etag}
	AuthToken string // used for header Authorization: token ${token}

	Request    *http.Request
	Response   *http.Response
	Body       []byte
	Value      any
	Err        error
	StatusCode int
	NoChange   bool // if Etag was given and StatusCode is 304 (NotModified)
}

// NewGitHubRequest creates new GitHub request
func NewGitHubRequest(uri string, value any) *JSONRequest {
	return &JSONRequest{
		URIPath:   uri,
		Server:    githubServer,
		AuthToken: getGithubToken(),
		Value:     value,
	}
}

// Get runs GET request
func (r *JSONRequest) Get() error {
	uri := r.Server + r.URIPath
	req, err := http.NewRequest(http.MethodGet, uri, nil)
	if err != nil {
		return err
	}
	if r.AuthToken != "" {
		req.Header.Set("Authorization", "token "+r.AuthToken)
	}
	if r.Etag != "" {
		req.Header.Set("If-None-Match", r.Etag)
	}
	r.Request = req
	r.Response, r.Err = http.DefaultClient.Do(req)
	if r.Err != nil {
		return r.Err
	}
	resp := r.Response
	if resp.StatusCode >= 400 {
		r.Err = fmt.Errorf("http.Do('%s') failed with '%s'", uri, resp.Status)
		return r.Err
	}
	if resp.StatusCode == http.StatusNotModified {
		r.NoChange = true
		return nil
	}
	defer u.CloseNoError(resp.Body)
	r.Body, r.Err = ioutil.ReadAll(resp.Body)
	if r.Err != nil {
		return r.Err
	}

	if r.Value != nil {
		r.Err = json.Unmarshal(r.Body, r.Value)
	}
	return r.Err
}

func gistDownload(gistID string, etag string) (*JSONRequest, *Gist, error) {
	endpoint := "/gists/" + gistID
	gist := &Gist{}
	req := NewGitHubRequest(endpoint, gist)
	err := req.Get()
	/* TODO: download truncated */
	return req, gist, err
}
