import type { LegacyValue } from "../../lib/legacy-types";

import { useState } from "react";
import PublicIcon from "./PublicIcon";

function InstructorCard({ instructor, onViewProfile }: LegacyValue) {
  const [failedImage, setFailedImage] = useState<LegacyValue>(null);
  const image = instructor.image || instructor.photo;
  return (
    <article className="public-instructor-card">
      <div className="public-instructor-portrait">
        {image && failedImage !== image ? <img src={image} alt={instructor.name} loading="lazy" onError={() => setFailedImage(image)} /> : <span className="public-instructor-initials" role="img" aria-label={`${instructor.name} avatar`}>{instructor.initials || instructor.name.split(' ').map((part: LegacyValue) => part[0]).join('')}</span>}
      </div>
      <div className="public-instructor-body">
        <h3>{instructor.name}</h3>
        <span className="public-instructor-skill">{instructor.skill}</span>
        <p>{instructor.experience}</p>
        <div className="public-instructor-meta"><span><PublicIcon name="star" /> {instructor.rating}</span><span>{instructor.count} courses</span></div>
        <button type="button" onClick={() => onViewProfile(instructor)}>View Profile <PublicIcon name="arrow" /></button>
      </div>
    </article>
  );
}
export default InstructorCard;
