from typing import Any


def _total_files_upload(jobs_images) -> int:
    return len([job.image.image_path for job in jobs_images])


def _total_class1_files(jobs_images) -> int:
    return len([job.image.image_path for job in jobs_images if job.image.object_class == 1])


def _total_class0_files(jobs_images) -> int:
    return len([job.image.image_path for job in jobs_images if job.image.object_class == 0])


def _total_files_without_objects(jobs_images) -> int:
    return len([job.image.image_path for job in jobs_images if len(job.image.border) == 0])


def _average_animals_per_photo(jobs_images) -> float:
    arr = [len(job.image.border) for job in jobs_images]
    if len(arr) == 0:
        return 0.

    return sum(arr)/len(arr)


def _total_bbox_number(jobs_images) -> int:
    return sum([len(job.image.border) for job in jobs_images])


def get_stats(jobs_images) -> dict[str, Any]:
    return {
        'total_files_uploaded': _total_files_upload(jobs_images),
        'total_class1_files': _total_class1_files(jobs_images),
        'total_class0_files': _total_class0_files(jobs_images),
        'total_files_without_objects': _total_files_without_objects(jobs_images),
        'average_animals_per_photo': _average_animals_per_photo(jobs_images),
        'total_bbox_number': _total_bbox_number(jobs_images)
    }