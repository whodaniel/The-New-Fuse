import os
import requests
import mimetypes

urls = [
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=d8e23b93-0a09-4674-b8c4-6925f93e14a2",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=e295aa03-cd15-4eb6-8e21-5dfb96115fcd",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=d28e0f28-2de6-452c-821f-5bb782c76b50",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=ccb9c262-d9e8-425b-b6be-8a72c42c16fe",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=203e0748-b494-4901-88f5-d34ac911159f",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=73ca82db-3b18-4bb2-ae37-73b46da02ea9",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=d923d416-0521-4f8e-b976-cf938c9ba05c",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=36301179-f791-4de3-8497-6a49ad6ccaf9",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=bdf1fbc0-7eba-4891-878d-e2b7e3d0029f",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=a9c7197c-aad4-44e3-a546-db51a53bbaf6",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=b93a57f2-7052-4051-b6d4-7b9b37ee35eb",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=f4ffcfe2-b234-416f-8a4c-833a83385f42",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=7fc6206f-18ef-4850-aa8b-cb306a180bc7",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=1ac1583d-dd53-4119-81d1-39be8a015a46",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=ec20edd7-0e8a-4b1a-9f8f-45657b782e10",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=b8cf4b50-df0d-4609-b33b-581fe202da68",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=88395f87-7bc3-43c0-bfad-548a4cf1c18c",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=fc845de2-77df-483f-ae33-35d1fb5d3b21",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=5b652f14-0e5f-4989-954f-88923b6b4382",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=24af4066-bc02-4c47-a86d-11a7edae5ae4",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=a60444b4-b665-405b-aaa7-ad1a3cfc88df",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=3d79a09b-6f13-4715-848a-4b160becd2f3",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=1460a8ea-0f12-4216-978c-062c8e5a05d5",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=242489ba-f5c1-4bc0-994f-024cb3568e94",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=e8d8dd84-af3d-411a-ac32-b33c2a9879da",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=1a6e405c-b19c-4d4d-b526-abb4be576144",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=904c37b2-e3b1-49b2-8273-e45a41e1d7b0",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=fefc3da1-404c-4d95-9362-3a195b74d6a9",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=4fd410ce-7676-41ac-959e-06183ed6e8b6",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=1b76d85d-599e-41c8-aaf3-83d6cad4ede7",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=846e868b-e5fe-492d-a0fa-20b410979ba6",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=33f548cb-cab4-4d1e-b9c0-bc87b410b89a",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=0aae6c59-1ec1-4d11-8766-5f305784826a",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=32facad6-2b2f-4014-8e45-b50035de5f89",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=e2e3d408-3d8f-4745-b2bf-0bb9512d396e",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=e2a5ea25-7c92-43cb-a787-1ea6731bb86a",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=d090e00c-360a-4390-9562-ea5b6278e165",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=03a29cec-9d3b-4043-9a65-a1ccd7fc9be1",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=9375fe3a-465f-4398-830e-abaaac06490a",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=543a8bf7-a4fe-4aa8-9602-a11908672fdc",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=4a1f04eb-c9ca-48be-9be5-1db1c75eb1e7",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=912ec331-3126-4320-a5f3-c0c2d620cdf7",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=60768aae-891d-49ad-b171-bdbc14b6dc88",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=bb587d59-8906-44b9-9f7b-af0302b8cc5a",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=a9274245-9990-469a-a340-a92f16eacd08",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=bc15534c-7bb0-47d8-b39f-09f36ef850e6",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=19690a91-f701-4a2c-8586-a1eef9c1a195",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=28cff58b-31ba-43a4-ba98-2ae2a129ea85",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=fa5e2aba-5e68-4ab9-9be5-884dd948ef38",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=59a58049-cb4e-4885-aa3d-d0dd3b6368fb",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=efc95e0c-83a9-40a0-b1f4-d98c804208d8",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=fe0d7b9a-618c-44e6-9222-f469bb453a27",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=11d5dd71-f026-44fa-acc4-ac08d0b4f0d2",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=81ba39cb-9c6c-4edb-812d-a321702817e7",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=7e375348-9379-4ca4-ba73-d3cdfbc0b985",
    "https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=adb3e7dd-63ad-4828-be48-ff174904c030"
]

output_dir = "fx_extracted_images"
os.makedirs(output_dir, exist_ok=True)

for url in urls:
    name = url.split("name=")[1]
    import json
    # Use trpc endpoint payload: {"0":{"json":{"name":"...","assetType":"...","versionId":"..."}}}
    # But since it's just a GET URL returning a redirect, we can download directly
    res = requests.get(url, allow_redirects=True)
    if res.status_code == 200:
        ext = mimetypes.guess_extension(res.headers.get("content-type", "")) or ".png"
        filepath = os.path.join(output_dir, name + ext)
        with open(filepath, "wb") as f:
            f.write(res.content)
        print(f"Saved {filepath}")
    else:
        print(f"Failed to download {name}, status: {res.status_code}")
