import { randomBytes } from 'node:crypto';
import { certificatesCollection, enrollmentsCollection } from '../../../models/index.js';
import { levelLabel, mentionFor } from '../../../constants/enums.js';
import { canAccessCampus } from '../../../helpers/campusScope.js';
import { badRequest } from '../../../helpers/errors.js';
import { fullName } from '../../../helpers/strings.js';
import generateNumber from '../Counter/generateNumber.js';

// Creates the certificates of passed enrollments (skips those that already have one) and returns all their ids,
// so the page can print the batch straight away.
const issueCertificates = async ({ enrollmentIds = [] } = {}, user) => {
  if (!enrollmentIds.length) throw badRequest('Choose at least one student');
  const enrollments = await enrollmentsCollection
    .find({ _id: { $in: enrollmentIds }, finalResult: 'passed' })
    .populate('student', 'firstName lastName birthDate birthPlace')
    .populate('group', 'name startDate endDate')
    .populate({ path: 'program', select: 'name audience levels language', populate: { path: 'language', select: 'name' } })
    .populate('campus', 'name')
    .lean();
  const existing = await certificatesCollection.find({ enrollment: { $in: enrollments.map((e) => e._id) }, status: { $ne: 'revoked' } }, { enrollment: 1 }).lean();
  const have = new Map(existing.map((c) => [String(c.enrollment), c._id]));

  const ids = [];
  for (const e of enrollments) {
    if (!canAccessCampus(user, e.campus?._id)) continue;
    if (have.has(String(e._id))) {
      ids.push(have.get(String(e._id)));
      continue;
    }
    const level = e.program?.levels?.find((l) => l.number === e.levelNumber);
    const cert = await certificatesCollection.create({
      number: await generateNumber('CERT'),
      code: randomBytes(6).toString('base64url'),
      enrollment: e._id,
      student: e.student._id,
      group: e.group?._id,
      program: e.program?._id,
      levelNumber: e.levelNumber,
      campus: e.campus._id,
      studentName: fullName(e.student),
      birthDate: e.student.birthDate,
      birthPlace: e.student.birthPlace,
      programName: e.program?.name,
      languageName: e.program?.language?.name,
      levelName: levelLabel(e.levelNumber, e.program?.levels, e.program?.audience),
      campusName: e.campus?.name,
      startDate: e.group?.startDate ?? e.enrolledAt,
      endDate: e.group?.endDate ?? e.endedAt,
      hours: level?.hours,
      finalScore: e.finalScore ?? undefined,
      mention: mentionFor(e.finalScore) ?? undefined,
      issuedBy: user?._id,
    });
    ids.push(cert._id);
  }
  return { ids };
};

export default issueCertificates;
