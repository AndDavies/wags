import { FaFacebookF, FaTwitter, FaLinkedinIn } from '@/components/icons/IconLibrary';

const ShareButtons: React.FC<{ url: string; title: string }> = ({ url, title }) => {
  // Build custom share URLs or use your preferred implementation here
  return (
    <div className="flex space-x-2">
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on Facebook"
      >
        <FaFacebookF size={32} className="text-blue-600" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on Twitter"
      >
        <FaTwitter size={32} className="text-blue-400" />
      </a>
      <a
        href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on LinkedIn"
      >
        <FaLinkedinIn size={32} className="text-blue-700" />
      </a>
    </div>
  );
};

export default ShareButtons;
